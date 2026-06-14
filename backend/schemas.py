"""Pydantic 请求/响应模型。"""

import enum
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from models import ListenStatus


class EpisodeBase(BaseModel):
    """单集公共字段。"""

    title: str = Field(..., min_length=1, max_length=300)
    recommendation: str | None = None
    duration: int | None = Field(None, ge=1)
    listen_status: str = "未收听"


class EpisodeCreate(EpisodeBase):
    """创建单集。"""


class EpisodeUpdate(BaseModel):
    """更新单集（部分字段可选）。"""

    title: str | None = Field(None, min_length=1, max_length=300)
    recommendation: str | None = None
    duration: int | None = Field(None, ge=1)
    listen_status: str | None = None


class EpisodeListenStatusUpdate(BaseModel):
    """更新单集收听状态。"""

    listen_status: str = Field(..., pattern="^(未收听|已收听)$")


class BatchListenStatusUpdateResponse(BaseModel):
    """批量更新收听状态响应。"""

    updated_count: int
    podcast_id: int


class EpisodeResponse(EpisodeBase):
    """单集响应。"""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    podcast_id: int


class EpisodeWithPodcastResponse(EpisodeBase):
    """单集响应（含所属播客信息）。"""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    podcast_id: int
    podcast_name: str
    duration: int | None = None
    listen_status: str = "未收听"


class RandomEpisodeRecommendationResponse(BaseModel):
    """随机推荐未收听单集响应。"""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    podcast_id: int
    title: str
    recommendation: str | None = None
    podcast_name: str


class PodcastBase(BaseModel):
    """播客公共字段。"""

    name: str = Field(..., min_length=1, max_length=200)
    platform: str = Field(..., min_length=1, max_length=100)
    theme: str = Field(..., min_length=1, max_length=200)
    rating: float = Field(..., ge=0, le=10)
    notes: str | None = None
    subscribe_url: str | None = None
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
    subscribe_url: str | None = None


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


class PodcastThemeItem(BaseModel):
    """主题分组中的播客条目。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    platform: str
    rating: float
    is_favorited: bool


class ThemeGroup(BaseModel):
    """主题分组响应。"""

    theme: str
    podcast_count: int
    podcasts: list[PodcastThemeItem]


class StatsResponse(BaseModel):
    """统计概览响应。"""

    total_podcasts: int
    total_episodes: int
    listened_episodes: int
    unlistened_episodes: int
    listen_completion_percent: float
    platform_stats: list[PlatformStats]


class ListeningNoteCreate(BaseModel):
    """创建听感笔记。"""

    content: str = Field(..., min_length=1)


class ListeningNoteUpdate(BaseModel):
    """更新听感笔记。"""

    content: str = Field(..., min_length=1)


class ListeningNoteResponse(BaseModel):
    """听感笔记响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    podcast_id: int
    content: str
    created_at: datetime


class EpisodeExport(BaseModel):
    """单集导出数据。"""

    title: str = Field(..., min_length=1, max_length=300)
    recommendation: str | None = None
    duration: int | None = Field(None, ge=1)
    listen_status: str = "未收听"


class ListeningNoteExport(BaseModel):
    """听感笔记导出数据。"""

    content: str = Field(..., min_length=1)
    created_at: str | None = None


class PodcastExport(BaseModel):
    """播客导出数据（含单集和听感笔记）。"""

    name: str = Field(..., min_length=1, max_length=200)
    platform: str = Field(..., min_length=1, max_length=100)
    theme: str = Field(..., min_length=1, max_length=200)
    rating: float = Field(..., ge=0, le=10)
    notes: str | None = None
    subscribe_url: str | None = None
    is_favorited: bool = False
    episodes: list[EpisodeExport] = []
    listening_notes: list[ListeningNoteExport] = []


class ExportData(BaseModel):
    """完整导出数据结构。"""

    version: str = "1.0"
    exported_at: str
    podcasts: list[PodcastExport]


class ImportResponse(BaseModel):
    """导入结果响应。"""

    success: bool
    message: str
    imported_podcasts: int
    imported_episodes: int
    imported_notes: int


class ImportMode(str, enum.Enum):
    """导入模式。"""

    APPEND = "append"
    OVERWRITE = "overwrite"
