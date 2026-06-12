"""SQLite 数据库连接与初始化。"""

from pathlib import Path

from sqlalchemy import create_engine
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
