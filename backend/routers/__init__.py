from routers.data import router as data_router
from routers.episodes import router as episodes_router
from routers.listening_notes import router as listening_notes_router
from routers.podcasts import router as podcasts_router
from routers.statistics import router as statistics_router

__all__ = [
    "data_router",
    "episodes_router",
    "listening_notes_router",
    "podcasts_router",
    "statistics_router",
]
