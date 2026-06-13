from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from models import Episode, Podcast


@dataclass
class PlatformStatsData:
    platform: str
    podcast_count: int
    avg_rating: float


@dataclass
class StatsData:
    total_podcasts: int
    total_episodes: int
    platform_stats: list[PlatformStatsData]


def get_stats(db: Session) -> StatsData:
    total_podcasts = db.query(func.count(Podcast.id)).scalar() or 0
    total_episodes = db.query(func.count(Episode.id)).scalar() or 0

    platform_rows = (
        db.query(
            Podcast.platform,
            func.count(Podcast.id).label("podcast_count"),
            func.avg(Podcast.rating).label("avg_rating"),
        )
        .group_by(Podcast.platform)
        .order_by(Podcast.platform)
        .all()
    )

    platform_stats = [
        PlatformStatsData(
            platform=row.platform,
            podcast_count=row.podcast_count,
            avg_rating=round(row.avg_rating or 0.0, 2),
        )
        for row in platform_rows
    ]

    return StatsData(
        total_podcasts=total_podcasts,
        total_episodes=total_episodes,
        platform_stats=platform_stats,
    )


def list_platforms(db: Session) -> list[str]:
    rows = (
        db.query(models.Podcast.platform)
        .distinct()
        .order_by(models.Podcast.platform)
        .all()
    )
    return [row.platform for row in rows]
