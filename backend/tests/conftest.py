import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, StaticPool, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

from database import Base, get_db
from main import app
from models import Episode, ListenStatus, Podcast


TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def _truncate_tables(db: Session) -> None:
    db.execute(text("DELETE FROM episodes"))
    db.execute(text("DELETE FROM podcasts"))
    db.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_database():
    db = TestingSessionLocal()
    try:
        _truncate_tables(db)
    finally:
        db.close()
    yield
    db = TestingSessionLocal()
    try:
        _truncate_tables(db)
    finally:
        db.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def make_podcast(db_session):
    def _make(
        name: str = "测试播客",
        platform: str = "小宇宙",
        theme: str = "技术",
        rating: float = 8.0,
        is_favorited: bool = False,
        notes: str | None = None,
        subscribe_url: str | None = None,
    ) -> Podcast:
        podcast = Podcast(
            name=name,
            platform=platform,
            theme=theme,
            rating=rating,
            is_favorited=is_favorited,
            notes=notes,
            subscribe_url=subscribe_url,
        )
        db_session.add(podcast)
        db_session.commit()
        db_session.refresh(podcast)
        return podcast

    return _make


@pytest.fixture
def make_episode(db_session):
    def _make(
        podcast_id: int,
        title: str = "测试单集",
        recommendation: str | None = None,
        listen_status: ListenStatus = ListenStatus.UNLISTENED,
        duration: int | None = None,
    ) -> Episode:
        episode = Episode(
            podcast_id=podcast_id,
            title=title,
            recommendation=recommendation,
            listen_status=listen_status,
            duration=duration,
        )
        db_session.add(episode)
        db_session.commit()
        db_session.refresh(episode)
        return episode

    return _make
