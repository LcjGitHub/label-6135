"""小众播客节目单 API 入口。"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db
from schemas import (
    EpisodeCreate,
    EpisodeResponse,
    EpisodeUpdate,
    PodcastCreate,
    PodcastDetailResponse,
    PodcastResponse,
    PodcastUpdate,
    StatsResponse,
)
from seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    """应用启动时建表并写入种子数据。"""
    Base.metadata.create_all(bind=engine)
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


@app.get("/api/podcasts", response_model=list[PodcastResponse])
def list_podcasts(db: Session = Depends(get_db)):
    """获取播客列表。"""
    return db.query(models.Podcast).order_by(models.Podcast.id).all()


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)
