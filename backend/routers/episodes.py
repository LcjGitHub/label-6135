from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from database import get_db
from models import ListenStatus
from schemas import (
    BatchListenStatusUpdateResponse,
    EpisodeCreate,
    EpisodeListenStatusUpdate,
    EpisodeResponse,
    EpisodeUpdate,
    EpisodeWithPodcastResponse,
    RandomEpisodeRecommendationResponse,
)

router = APIRouter(tags=["单集"])


@router.get("/api/episodes", response_model=list[EpisodeWithPodcastResponse])
def list_all_episodes(
    db: Session = Depends(get_db),
    listen_status: str | None = Query(None, pattern="^(未收听|已收听)$"),
):
    query = db.query(
        models.Episode.id,
        models.Episode.podcast_id,
        models.Episode.title,
        models.Episode.recommendation,
        models.Episode.duration,
        models.Episode.listen_status,
        models.Podcast.name.label("podcast_name"),
    ).join(models.Podcast, models.Episode.podcast_id == models.Podcast.id)

    if listen_status:
        target_status = (
            ListenStatus.LISTENED if listen_status == "已收听" else ListenStatus.UNLISTENED
        )
        query = query.filter(models.Episode.listen_status == target_status)

    rows = query.order_by(models.Episode.id).all()
    return [
        {
            "id": row.id,
            "podcast_id": row.podcast_id,
            "title": row.title,
            "recommendation": row.recommendation,
            "duration": row.duration,
            "podcast_name": row.podcast_name,
            "listen_status": row.listen_status.value if row.listen_status else "未收听",
        }
        for row in rows
    ]


@router.get(
    "/api/podcasts/{podcast_id}/episodes",
    response_model=list[EpisodeResponse],
)
def list_episodes(
    podcast_id: int,
    keyword: str | None = Query(None, min_length=1, max_length=300),
    sort_by_title: str | None = Query(None, pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    query = db.query(models.Episode).filter(models.Episode.podcast_id == podcast_id)
    if keyword:
        query = query.filter(models.Episode.title.contains(keyword))
    if sort_by_title == "asc":
        query = query.order_by(models.Episode.title.asc())
    elif sort_by_title == "desc":
        query = query.order_by(models.Episode.title.desc())
    else:
        query = query.order_by(models.Episode.id)
    return query.all()


@router.post(
    "/api/podcasts/{podcast_id}/episodes",
    response_model=EpisodeResponse,
    status_code=201,
)
def create_episode(
    podcast_id: int,
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")

    episode = models.Episode(podcast_id=podcast_id, **payload.model_dump())
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode


@router.put("/api/episodes/{episode_id}", response_model=EpisodeResponse)
def update_episode(
    episode_id: int,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
):
    episode = db.query(models.Episode).filter(models.Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="单集不存在")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(episode, key, value)

    db.commit()
    db.refresh(episode)
    return episode


@router.delete("/api/episodes/{episode_id}", status_code=204)
def delete_episode(episode_id: int, db: Session = Depends(get_db)):
    episode = db.query(models.Episode).filter(models.Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="单集不存在")
    db.delete(episode)
    db.commit()


@router.put("/api/episodes/{episode_id}/listen-status", response_model=EpisodeResponse)
def update_listen_status(
    episode_id: int,
    payload: EpisodeListenStatusUpdate,
    db: Session = Depends(get_db),
):
    episode = db.query(models.Episode).filter(models.Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="单集不存在")
    episode.listen_status = (
        ListenStatus.LISTENED if payload.listen_status == "已收听" else ListenStatus.UNLISTENED
    )
    db.commit()
    db.refresh(episode)
    return episode


@router.put(
    "/api/podcasts/{podcast_id}/episodes/listen-status",
    response_model=BatchListenStatusUpdateResponse,
)
def update_all_episodes_listen_status(
    podcast_id: int,
    payload: EpisodeListenStatusUpdate,
    db: Session = Depends(get_db),
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    target_status = (
        ListenStatus.LISTENED if payload.listen_status == "已收听" else ListenStatus.UNLISTENED
    )
    result = (
        db.query(models.Episode)
        .filter(
            models.Episode.podcast_id == podcast_id,
            models.Episode.listen_status != target_status,
        )
        .update({models.Episode.listen_status: target_status})
    )
    db.commit()
    return {
        "updated_count": result,
        "podcast_id": podcast_id,
    }


@router.get(
    "/api/episodes/random-unlistened",
    response_model=RandomEpisodeRecommendationResponse,
)
def get_random_unlistened_episode(db: Session = Depends(get_db)):
    row = (
        db.query(
            models.Episode.id,
            models.Episode.podcast_id,
            models.Episode.title,
            models.Episode.recommendation,
            models.Podcast.name.label("podcast_name"),
        )
        .join(models.Podcast, models.Episode.podcast_id == models.Podcast.id)
        .filter(models.Episode.listen_status == ListenStatus.UNLISTENED)
        .order_by(func.random())
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="暂无可推荐的未收听单集")
    return {
        "id": row.id,
        "podcast_id": row.podcast_id,
        "title": row.title,
        "recommendation": row.recommendation,
        "podcast_name": row.podcast_name,
    }
