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
    检测 episodes 表字段：
    - 若存在旧的 listened 布尔字段，迁移为 listen_status 枚举字段
    - 若缺少 listen_status 字段则添加
    """
    inspector = inspect(engine)

    if not inspector.has_table("podcasts"):
        return

    columns = {col["name"] for col in inspector.get_columns("podcasts")}
    if "subscribe_url" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE podcasts ADD COLUMN subscribe_url VARCHAR(500)"
                )
            )
    if "subscribe_url" in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE podcasts SET subscribe_url = 'https://www.xiaoyuzhoufm.com/podcast/frontend-coffee' "
                    "WHERE name = '前端早咖啡' AND (subscribe_url IS NULL OR subscribe_url = '')"
                )
            )
            conn.execute(
                text(
                    "UPDATE podcasts SET subscribe_url = 'https://podcasts.apple.com/cn/podcast/indie-dev-radio' "
                    "WHERE name = '独立开发者电台' AND (subscribe_url IS NULL OR subscribe_url = '')"
                )
            )
            conn.execute(
                text(
                    "UPDATE podcasts SET subscribe_url = 'https://music.163.com/#/djradio?id=99999999' "
                    "WHERE name = '设计杂谈' AND (subscribe_url IS NULL OR subscribe_url = '')"
                )
            )
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

    if "listened" in episode_columns and "listen_status" not in episode_columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE episodes ADD COLUMN listen_status TEXT NOT NULL DEFAULT '未收听'"
                )
            )
            conn.execute(
                text(
                    "UPDATE episodes SET listen_status = CASE WHEN listened = 1 THEN '已收听' ELSE '未收听' END"
                )
            )
            conn.execute(text("ALTER TABLE episodes DROP COLUMN listened"))
    elif "listen_status" not in episode_columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE episodes ADD COLUMN listen_status TEXT NOT NULL DEFAULT '未收听'"
                )
            )
