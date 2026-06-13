"""SQLite 数据库连接与初始化。"""

from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DATA_DIR / 'podcast.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 声明基类。"""


def get_db():
    """
    FastAPI 依赖：提供数据库会话并在请求结束后关闭。

    @yields {Session} SQLAlchemy 会话
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_database() -> None:
    """
    应用启动时执行数据库结构迁移。
    检测 podcasts 表是否缺少 is_favorited 字段，若缺少则添加，
    并将第一条播客设为已收藏。
    检测 episodes 表是否缺少 listened 字段，若缺少则添加。
    """
    inspector = inspect(engine)

    if not inspector.has_table("podcasts"):
        return

    columns = {col["name"] for col in inspector.get_columns("podcasts")}
    if "is_favorited" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE podcasts ADD COLUMN is_favorited BOOLEAN NOT NULL DEFAULT 0"
                )
            )

            first_row = conn.execute(
                text("SELECT id FROM podcasts ORDER BY id LIMIT 1")
            ).fetchone()
            if first_row is not None:
                conn.execute(
                    text("UPDATE podcasts SET is_favorited = 1 WHERE id = :id"),
                    {"id": first_row[0]},
                )

    if not inspector.has_table("episodes"):
        return

    episode_columns = {col["name"] for col in inspector.get_columns("episodes")}
    if "listened" in episode_columns:
        return

    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE episodes ADD COLUMN listened BOOLEAN NOT NULL DEFAULT 0"
            )
        )
