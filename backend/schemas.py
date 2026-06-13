"""Pydantic 请求/响应模型。"""

from pydantic import BaseModel, ConfigDict, Field


class EpisodeBase(BaseModel):
    """单集公共字段。"""

    title: str = Field(..., min_length=1, max_length=300)
    recommendation: str | None = None
    listened: bool = False


class EpisodeCreate(EpisodeBase):
    """创建单集。"""


class EpisodeUpdate(BaseModel):
    """更新单集（部分字段可选）。"""

    title: str | None = Field(None, min_length=1, max_length=300)
    recommendation: str | None = None
    listened: bool | None = None


class EpisodeResponse(EpisodeBase):
    """单集响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    podcast_id: int


class EpisodeWithPodcastResponse(EpisodeBase):
    """单集响应（含所属播客信息）。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    podcast_id: int
    podcast_name: str
    listened: bool = False


class PodcastBase(BaseModel):
    """播客公共字段。"""

    name: str = Field(..., min_length=1, max_length=200)
    platform: str = Field(..., min_length=1, max_length=100)
    theme: str = Field(..., min_length=1, max_length=200)
    rating: float = Field(..., ge=0, le=10)
    notes: str | None = None
    is_favorited: bool = False


class PodcastCreate(PodcastBase):
    """创建播客。"""


class PodcastUpdate(BaseModel):
    """更新播客（部分字段可选）。"""

    name: str | None = Field(None, min_length=1, max_length=200)
    platform: str | None = Field(None, min_length=1, max_length=100)
    theme: str | None = Field(None, min_length=1, max_length=200)
    rating: float | None = Field(None, ge=0, le=10)
    notes: str | None = None


class PodcastResponse(PodcastBase):
    """播客列表项响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int


class PodcastDetailResponse(PodcastResponse):
    """播客详情（含单集列表）。"""

    episodes: list[EpisodeResponse] = []


class PlatformStats(BaseModel):
    """平台统计数据。"""

    platform: str
    podcast_count: int
    avg_rating: float


class StatsResponse(BaseModel):
    """统计概览响应。"""

    total_podcasts: int
    total_episodes: int
    platform_stats: list[PlatformStats]
