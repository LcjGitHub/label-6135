from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
from database import get_db
from schemas import (
    PodcastCreate,
    PodcastDetailResponse,
    PodcastResponse,
    PodcastUpdate,
    ThemeGroup,
)

router = APIRouter(prefix="/api/podcasts", tags=["播客"])


@router.get("", response_model=list[PodcastResponse])
def list_podcasts(
    favorited_only: bool = False,
    platform: str | None = Query(None, min_length=1, max_length=100),
    theme: str | None = Query(None, min_length=1, max_length=200),
    keyword: str | None = Query(None, min_length=1, max_length=200),
    sort_by_rating: str | None = Query(None, pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Podcast)
    if favorited_only:
        query = query.filter(models.Podcast.is_favorited == True)
    if platform:
        query = query.filter(models.Podcast.platform == platform)
    if theme:
        query = query.filter(models.Podcast.theme == theme)
    if keyword:
        query = query.filter(models.Podcast.name.contains(keyword))
    if sort_by_rating == "desc":
        query = query.order_by(models.Podcast.rating.desc(), models.Podcast.id)
    elif sort_by_rating == "asc":
        query = query.order_by(models.Podcast.rating.asc(), models.Podcast.id)
    else:
        query = query.order_by(models.Podcast.id)
    return query.all()


@router.get("/themes/grouped", response_model=list[ThemeGroup])
def list_podcasts_by_theme(db: Session = Depends(get_db)):
    podcasts = db.query(models.Podcast).order_by(models.Podcast.theme, models.Podcast.id).all()
    groups: dict[str, list[models.Podcast]] = {}
    for podcast in podcasts:
        if podcast.theme not in groups:
            groups[podcast.theme] = []
        groups[podcast.theme].append(podcast)
    result = []
    for theme, theme_podcasts in groups.items():
        result.append(
            ThemeGroup(
                theme=theme,
                podcast_count=len(theme_podcasts),
                podcasts=theme_podcasts,
            )
        )
    result.sort(key=lambda g: (-g.podcast_count, g.theme))
    return result


@router.post("", response_model=PodcastResponse, status_code=201)
def create_podcast(payload: PodcastCreate, db: Session = Depends(get_db)):
    podcast = models.Podcast(**payload.model_dump())
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    return podcast


@router.get("/{podcast_id}", response_model=PodcastDetailResponse)
def get_podcast(podcast_id: int, db: Session = Depends(get_db)):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    return podcast


@router.put("/{podcast_id}", response_model=PodcastResponse)
def update_podcast(
    podcast_id: int,
    payload: PodcastUpdate,
    db: Session = Depends(get_db),
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(podcast, key, value)

    db.commit()
    db.refresh(podcast)
    return podcast


@router.delete("/{podcast_id}", status_code=204)
def delete_podcast(podcast_id: int, db: Session = Depends(get_db)):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    db.delete(podcast)
    db.commit()


@router.patch("/{podcast_id}/favorite", response_model=PodcastResponse)
def toggle_favorite(podcast_id: int, db: Session = Depends(get_db)):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    podcast.is_favorited = not podcast.is_favorited
    db.commit()
    db.refresh(podcast)
    return podcast
