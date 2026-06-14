from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import StatsResponse
from services import get_stats, list_platforms, list_themes

router = APIRouter(prefix="/api", tags=["统计"])


@router.get("/stats", response_model=StatsResponse)
def get_stats_endpoint(db: Session = Depends(get_db)):
    stats = get_stats(db)
    return {
        "total_podcasts": stats.total_podcasts,
        "total_episodes": stats.total_episodes,
        "listened_episodes": stats.listened_episodes,
        "unlistened_episodes": stats.unlistened_episodes,
        "listen_completion_percent": stats.listen_completion_percent,
        "platform_stats": [
            {
                "platform": p.platform,
                "podcast_count": p.podcast_count,
                "avg_rating": p.avg_rating,
            }
            for p in stats.platform_stats
        ],
    }


@router.get("/platforms", response_model=list[str])
def list_platforms_endpoint(db: Session = Depends(get_db)):
    return list_platforms(db)


@router.get("/themes", response_model=list[str])
def list_themes_endpoint(db: Session = Depends(get_db)):
    return list_themes(db)
