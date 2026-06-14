from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from models import Episode, Podcast, ListenStatus


@dataclass
class PlatformStatsData:
    platform: str
    podcast_count: int
    avg_rating: float


@dataclass
class ThemeStatsData:
    theme: str
    podcast_count: int


@dataclass
class StatsData:
    total_podcasts: int
    total_episodes: int
    listened_episodes: int
    unlistened_episodes: int
    listen_completion_percent: float
    platform_stats: list[PlatformStatsData]
    theme_stats: list[ThemeStatsData]


def get_stats(db: Session) -> StatsData:
    total_podcasts = db.query(func.count(Podcast.id)).scalar() or 0
    total_episodes = db.query(func.count(Episode.id)).scalar() or 0

    listened_episodes = (
        db.query(func.count(Episode.id))
        .filter(Episode.listen_status == ListenStatus.LISTENED)
        .scalar()
        or 0
    )
    unlistened_episodes = total_episodes - listened_episodes
    listen_completion_percent = (
        round((listened_episodes / total_episodes) * 100, 2)
        if total_episodes > 0
        else 0.0
    )

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

    theme_rows = (
        db.query(
            Podcast.theme,
            func.count(Podcast.id).label("podcast_count"),
        )
        .group_by(Podcast.theme)
        .order_by(Podcast.theme)
        .all()
    )

    theme_stats = [
        ThemeStatsData(
            theme=row.theme,
            podcast_count=row.podcast_count,
        )
        for row in theme_rows
    ]

    return StatsData(
        total_podcasts=total_podcasts,
        total_episodes=total_episodes,
        listened_episodes=listened_episodes,
        unlistened_episodes=unlistened_episodes,
        listen_completion_percent=listen_completion_percent,
        platform_stats=platform_stats,
        theme_stats=theme_stats,
    )


def list_platforms(db: Session) -> list[str]:
    rows = (
        db.query(models.Podcast.platform)
        .distinct()
        .order_by(models.Podcast.platform)
        .all()
    )
    return [row.platform for row in rows]


def list_themes(db: Session) -> list[str]:
    rows = (
        db.query(models.Podcast.theme)
        .distinct()
        .order_by(models.Podcast.theme)
        .all()
    )
    return [row.theme for row in rows]
