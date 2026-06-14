/** 单集收听状态 */
export type ListenStatus = '未收听' | '已收听';

/** 批量更新收听状态响应 */
export interface BatchListenStatusUpdateResponse {
  updated_count: number;
  podcast_id: number;
}

/** 播客实体 */
export interface Podcast {
  id: number;
  name: string;
  platform: string;
  theme: string;
  rating: number;
  notes: string | null;
  subscribe_url: string | null;
  is_favorited: boolean;
}

/** 单集实体 */
export interface Episode {
  id: number;
  podcast_id: number;
  title: string;
  recommendation: string | null;
  duration: number | null;
  listen_status: ListenStatus;
}

/** 单集实体（含所属播客信息） */
export interface EpisodeWithPodcast {
  id: number;
  podcast_id: number;
  title: string;
  recommendation: string | null;
  duration: number | null;
  podcast_name: string;
  listen_status: ListenStatus;
}

/** 随机推荐未收听单集 */
export interface RandomEpisodeRecommendation {
  id: number;
  podcast_id: number;
  title: string;
  recommendation: string | null;
  podcast_name: string;
}

/** 播客详情（含单集） */
export interface PodcastDetail extends Podcast {
  episodes: Episode[];
}

/** 创建/更新播客表单 */
export interface PodcastFormData {
  name: string;
  platform: string;
  theme: string;
  rating: number;
  notes: string;
  subscribe_url: string;
}

/** 创建/更新单集表单 */
export interface EpisodeFormData {
  title: string;
  recommendation: string;
  duration: string;
}

/** 平台统计数据 */
export interface PlatformStats {
  platform: string;
  podcast_count: number;
  avg_rating: number;
}

/** 主题统计数据 */
export interface ThemeStats {
  theme: string;
  podcast_count: number;
}

/** 统计概览数据 */
export interface Stats {
  total_podcasts: number;
  total_episodes: number;
  listened_episodes: number;
  unlistened_episodes: number;
  listen_completion_percent: number;
  platform_stats: PlatformStats[];
  theme_stats: ThemeStats[];
}

/** 主题分组中的播客条目 */
export interface PodcastThemeItem {
  id: number;
  name: string;
  platform: string;
  rating: number;
  is_favorited: boolean;
}

/** 主题分组数据 */
export interface ThemeGroup {
  theme: string;
  podcast_count: number;
  podcasts: PodcastThemeItem[];
}

/** 听感笔记实体 */
export interface ListeningNote {
  id: number;
  podcast_id: number;
  content: string;
  created_at: string;
}

/** 创建/更新听感笔记表单 */
export interface ListeningNoteFormData {
  content: string;
}

/** 导入模式 */
export type ImportMode = 'append' | 'overwrite';

/** 导入结果响应 */
export interface ImportResponse {
  success: boolean;
  message: string;
  imported_podcasts: number;
  imported_episodes: number;
  imported_notes: number;
}
