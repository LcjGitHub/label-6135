import axios from 'axios';
import type {
  Episode,
  EpisodeFormData,
  Podcast,
  PodcastDetail,
  PodcastFormData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/** 获取播客列表 */
export async function fetchPodcasts(): Promise<Podcast[]> {
  const { data } = await api.get<Podcast[]>('/podcasts');
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
