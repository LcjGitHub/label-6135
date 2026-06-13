"""小众播客节目单 API 入口。"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db, migrate_database
from models import ListenStatus
from schemas import (
    EpisodeCreate,
    EpisodeListenStatusUpdate,
    EpisodeResponse,
    EpisodeUpdate,
    EpisodeWithPodcastResponse,
    PodcastCreate,
    PodcastDetailResponse,
    PodcastResponse,
    PodcastUpdate,
    StatsResponse,
)
from seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    """应用启动时建表、迁移结构并写入种子数据。"""
    Base.metadata.create_all(bind=engine)
    migrate_database()
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="小众播客节目单 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:7101", "http://127.0.0.1:7101"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """健康检查。"""
    return {"status": "ok"}


@app.get("/api/episodes", response_model=list[EpisodeWithPodcastResponse])
def list_all_episodes(db: Session = Depends(get_db)):
    """跨播客获取全部单集列表（含所属播客信息）。"""
    rows = (
        db.query(
            models.Episode.id,
            models.Episode.podcast_id,
            models.Episode.title,
            models.Episode.recommendation,
            models.Episode.listen_status,
            models.Podcast.name.label("podcast_name"),
        )
        .join(models.Podcast, models.Episode.podcast_id == models.Podcast.id)
        .order_by(models.Episode.id)
        .all()
    )
    return [
        {
            "id": row.id,
            "podcast_id": row.podcast_id,
            "title": row.title,
            "recommendation": row.recommendation,
            "podcast_name": row.podcast_name,
            "listen_status": row.listen_status.value if row.listen_status else "未收听",
        }
        for row in rows
    ]


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """获取统计概览数据。"""
    stats = models.Podcast.get_stats(db)
    return {
        "total_podcasts": stats.total_podcasts,
        "total_episodes": stats.total_episodes,
        "platform_stats": [
            {
                "platform": p.platform,
                "podcast_count": p.podcast_count,
                "avg_rating": p.avg_rating,
            }
            for p in stats.platform_stats
        ],
    }


@app.get("/api/platforms", response_model=list[str])
def list_platforms(db: Session = Depends(get_db)):
    """获取所有平台列表（去重）。"""
    rows = (
        db.query(models.Podcast.platform)
        .distinct()
        .order_by(models.Podcast.platform)
        .all()
    )
    return [row.platform for row in rows]


@app.get("/api/podcasts", response_model=list[PodcastResponse])
def list_podcasts(
    favorited_only: bool = False,
    platform: str | None = Query(None, min_length=1, max_length=100),
    keyword: str | None = Query(None, min_length=1, max_length=200),
    db: Session = Depends(get_db),
):
    """获取播客列表（支持平台筛选和名称模糊搜索）。"""
    query = db.query(models.Podcast)
    if favorited_only:
        query = query.filter(models.Podcast.is_favorited == True)
    if platform:
        query = query.filter(models.Podcast.platform == platform)
    if keyword:
        query = query.filter(models.Podcast.name.contains(keyword))
    return query.order_by(models.Podcast.id).all()


@app.patch("/api/podcasts/{podcast_id}/favorite", response_model=PodcastResponse)
def toggle_favorite(podcast_id: int, db: Session = Depends(get_db)):
    """切换播客收藏状态。"""
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    podcast.is_favorited = not podcast.is_favorited
    db.commit()
    db.refresh(podcast)
    return podcast


@app.post("/api/podcasts", response_model=PodcastResponse, status_code=201)
def create_podcast(payload: PodcastCreate, db: Session = Depends(get_db)):
    """创建播客。"""
    podcast = models.Podcast(**payload.model_dump())
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    return podcast


@app.get("/api/podcasts/{podcast_id}", response_model=PodcastDetailResponse)
def get_podcast(podcast_id: int, db: Session = Depends(get_db)):
    """获取播客详情（含单集列表）。"""
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    return podcast


@app.put("/api/podcasts/{podcast_id}", response_model=PodcastResponse)
def update_podcast(
    podcast_id: int,
    payload: PodcastUpdate,
    db: Session = Depends(get_db),
):
    """更新播客。"""
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(podcast, key, value)

    db.commit()
    db.refresh(podcast)
    return podcast


@app.delete("/api/podcasts/{podcast_id}", status_code=204)
def delete_podcast(podcast_id: int, db: Session = Depends(get_db)):
    """删除播客（级联删除单集）。"""
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    db.delete(podcast)
    db.commit()


@app.get(
    "/api/podcasts/{podcast_id}/episodes",
    response_model=list[EpisodeResponse],
)
def list_episodes(podcast_id: int, db: Session = Depends(get_db)):
    """获取指定播客的单集列表。"""
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    return podcast.episodes


@app.post(
    "/api/podcasts/{podcast_id}/episodes",
    response_model=EpisodeResponse,
    status_code=201,
)
def create_episode(
    podcast_id: int,
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
):
    """为播客新增单集。"""
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")

    episode = models.Episode(podcast_id=podcast_id, **payload.model_dump())
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode


@app.put("/api/episodes/{episode_id}", response_model=EpisodeResponse)
def update_episode(
    episode_id: int,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
):
    """更新单集。"""
    episode = db.query(models.Episode).filter(models.Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="单集不存在")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(episode, key, value)

    db.commit()
    db.refresh(episode)
    return episode


@app.delete("/api/episodes/{episode_id}", status_code=204)
def delete_episode(episode_id: int, db: Session = Depends(get_db)):
    """删除单集。"""
    episode = db.query(models.Episode).filter(models.Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="单集不存在")
    db.delete(episode)
    db.commit()


@app.put("/api/episodes/{episode_id}/listen-status", response_model=EpisodeResponse)
def update_listen_status(
    episode_id: int,
    payload: EpisodeListenStatusUpdate,
    db: Session = Depends(get_db),
):
    """更新单集收听状态（未收听/已收听）。"""
    episode = db.query(models.Episode).filter(models.Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="单集不存在")
    episode.listen_status = (
        ListenStatus.LISTENED if payload.listen_status == "已收听" else ListenStatus.UNLISTENED
    )
    db.commit()
    db.refresh(episode)
    return episode


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)
