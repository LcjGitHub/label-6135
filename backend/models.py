"""SQLAlchemy ORM 模型。"""

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Podcast(Base):
    """播客节目。"""

    __tablename__ = "podcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    platform: Mapped[str] = mapped_column(String(100), nullable=False)
    theme: Mapped[str] = mapped_column(String(200), nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    episodes: Mapped[list["Episode"]] = relationship(
        "Episode",
        back_populates="podcast",
        cascade="all, delete-orphan",
        order_by="Episode.id",
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

    podcast: Mapped["Podcast"] = relationship("Podcast", back_populates="episodes")
