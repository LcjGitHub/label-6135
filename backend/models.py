"""SQLAlchemy ORM 模型。"""

from dataclasses import dataclass

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from database import Base


@dataclass
class PlatformStatsData:
    """平台统计数据。"""

    platform: str
    podcast_count: int
    avg_rating: float


@dataclass
class StatsData:
    """统计概览数据。"""

    total_podcasts: int
    total_episodes: int
    platform_stats: list[PlatformStatsData]


class Podcast(Base):
    """播客节目。"""

    __tablename__ = "podcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    platform: Mapped[str] = mapped_column(String(100), nullable=False)
    theme: Mapped[str] = mapped_column(String(200), nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_favorited: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    episodes: Mapped[list["Episode"]] = relationship(
        "Episode",
        back_populates="podcast",
        cascade="all, delete-orphan",
        order_by="Episode.id",
    )

    @staticmethod
    def get_stats(db: Session) -> StatsData:
        """
        获取统计概览数据。

        @param {Session} db - SQLAlchemy 会话
        @returns {StatsData} 统计数据（播客总数、单集总数、各平台统计）
        """
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


class Episode(Base):
    """播客单集。"""

    __tablename__ = "episodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    podcast_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("podcasts.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    listened: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    podcast: Mapped["Podcast"] = relationship("Podcast", back_populates="episodes")
