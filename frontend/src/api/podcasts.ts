import axios from 'axios';
import type {
  Episode,
  EpisodeFormData,
  EpisodeWithPodcast,
  ListenStatus,
  Podcast,
  PodcastDetail,
  PodcastFormData,
  Stats,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/** 获取所有平台列表 */
export async function fetchPlatforms(): Promise<string[]> {
  const { data } = await api.get<string[]>('/platforms');
  return data;
}

/** 评分排序方式 */
export type RatingSort = 'none' | 'asc' | 'desc';

/** 获取播客列表（支持平台筛选、名称搜索和评分排序） */
export async function fetchPodcasts(
  favoritedOnly: boolean = false,
  platform?: string,
  keyword?: string,
  sortByRating: RatingSort = 'none',
): Promise<Podcast[]> {
  const params: Record<string, boolean | string> = {
    favorited_only: favoritedOnly,
  };
  if (platform) {
    params.platform = platform;
  }
  if (keyword) {
    params.keyword = keyword;
  }
  if (sortByRating !== 'none') {
    params.sort_by_rating = sortByRating;
  }
  const { data } = await api.get<Podcast[]>('/podcasts', { params });
  return data;
}

/** 获取播客详情 */
export async function fetchPodcast(id: number): Promise<PodcastDetail> {
  const { data } = await api.get<PodcastDetail>(`/podcasts/${id}`);
  return data;
}

/** 创建播客 */
export async function createPodcast(payload: PodcastFormData): Promise<Podcast> {
  const { data } = await api.post<Podcast>('/podcasts', {
    ...payload,
    notes: payload.notes || null,
  });
  return data;
}

/** 更新播客 */
export async function updatePodcast(
  id: number,
  payload: Partial<PodcastFormData>,
): Promise<Podcast> {
  const { data } = await api.put<Podcast>(`/podcasts/${id}`, {
    ...payload,
    notes: payload.notes === '' ? null : payload.notes,
  });
  return data;
}

/** 删除播客 */
export async function deletePodcast(id: number): Promise<void> {
  await api.delete(`/podcasts/${id}`);
}

/** 切换播客收藏状态 */
export async function toggleFavorite(id: number): Promise<Podcast> {
  const { data } = await api.patch<Podcast>(`/podcasts/${id}/favorite`);
  return data;
}

/** 创建单集 */
export async function createEpisode(
  podcastId: number,
  payload: EpisodeFormData,
): Promise<Episode> {
  const { data } = await api.post<Episode>(`/podcasts/${podcastId}/episodes`, {
    ...payload,
    recommendation: payload.recommendation || null,
  });
  return data;
}

/** 更新单集 */
export async function updateEpisode(
  id: number,
  payload: Partial<EpisodeFormData>,
): Promise<Episode> {
  const { data } = await api.put<Episode>(`/episodes/${id}`, {
    ...payload,
    recommendation: payload.recommendation === '' ? null : payload.recommendation,
  });
  return data;
}

/** 删除单集 */
export async function deleteEpisode(id: number): Promise<void> {
  await api.delete(`/episodes/${id}`);
}

/** 更新单集收听状态 */
export async function updateListenStatus(
  id: number,
  listenStatus: ListenStatus,
): Promise<Episode> {
  const { data } = await api.put<Episode>(`/episodes/${id}/listen-status`, {
    listen_status: listenStatus,
  });
  return data;
}

/** 获取统计概览 */
export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get<Stats>('/stats');
  return data;
}

/** 获取全部单集列表（跨播客） */
export async function fetchAllEpisodes(): Promise<EpisodeWithPodcast[]> {
  const { data } = await api.get<EpisodeWithPodcast[]>('/episodes');
  return data;
}
