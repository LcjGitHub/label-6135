import axios from 'axios';
import type {
  BatchListenStatusUpdateResponse,
  Episode,
  EpisodeFormData,
  EpisodeWithPodcast,
  ImportMode,
  ImportResponse,
  ListenStatus,
  ListeningNote,
  ListeningNoteFormData,
  Podcast,
  PodcastDetail,
  PodcastFormData,
  Stats,
  ThemeGroup,
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
    subscribe_url: payload.subscribe_url || null,
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
    subscribe_url: payload.subscribe_url === '' ? null : payload.subscribe_url,
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
    duration: payload.duration ? Number(payload.duration) : null,
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
    duration: payload.duration ? Number(payload.duration) : null,
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

/** 批量更新指定播客下全部单集的收听状态 */
export async function updateAllEpisodesListenStatus(
  podcastId: number,
  listenStatus: ListenStatus,
): Promise<BatchListenStatusUpdateResponse> {
  const { data } = await api.put<BatchListenStatusUpdateResponse>(
    `/podcasts/${podcastId}/episodes/listen-status`,
    {
      listen_status: listenStatus,
    },
  );
  return data;
}

/** 获取统计概览 */
export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get<Stats>('/stats');
  return data;
}

/** 获取指定播客的单集列表（支持标题关键词搜索） */
export async function fetchEpisodes(
  podcastId: number,
  keyword?: string,
): Promise<Episode[]> {
  const params: Record<string, string> = {};
  if (keyword) {
    params.keyword = keyword;
  }
  const { data } = await api.get<Episode[]>(`/podcasts/${podcastId}/episodes`, {
    params,
  });
  return data;
}

/** 获取全部单集列表（跨播客） */
export async function fetchAllEpisodes(): Promise<EpisodeWithPodcast[]> {
  const { data } = await api.get<EpisodeWithPodcast[]>('/episodes');
  return data;
}

/** 按主题分组获取播客列表 */
export async function fetchPodcastsByTheme(): Promise<ThemeGroup[]> {
  const { data } = await api.get<ThemeGroup[]>('/podcasts/themes/grouped');
  return data;
}

/** 获取指定播客的听感笔记列表 */
export async function fetchListeningNotes(
  podcastId: number,
): Promise<ListeningNote[]> {
  const { data } = await api.get<ListeningNote[]>(
    `/podcasts/${podcastId}/listening-notes`,
  );
  return data;
}

/** 创建听感笔记 */
export async function createListeningNote(
  podcastId: number,
  payload: ListeningNoteFormData,
): Promise<ListeningNote> {
  const { data } = await api.post<ListeningNote>(
    `/podcasts/${podcastId}/listening-notes`,
    payload,
  );
  return data;
}

/** 更新听感笔记 */
export async function updateListeningNote(
  id: number,
  payload: ListeningNoteFormData,
): Promise<ListeningNote> {
  const { data } = await api.put<ListeningNote>(
    `/listening-notes/${id}`,
    payload,
  );
  return data;
}

/** 删除听感笔记 */
export async function deleteListeningNote(id: number): Promise<void> {
  await api.delete(`/listening-notes/${id}`);
}

/** 导出全部数据为 JSON 文件 */
export async function exportAllData(): Promise<void> {
  const response = await api.get('/data/export', {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const contentDisposition = response.headers['content-disposition'];
  let filename = `podcast_export_${new Date().toISOString().slice(0, 10)}.json`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename=(.+)/);
    if (match) {
      filename = match[1];
    }
  }
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** 导入数据文件 */
export async function importData(
  file: File,
  mode: ImportMode,
): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);
  
  const { data } = await api.post<ImportResponse>('/data/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return data;
}
