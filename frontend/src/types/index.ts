/** 播客实体 */
export interface Podcast {
  id: number;
  name: string;
  platform: string;
  theme: string;
  rating: number;
  notes: string | null;
  is_favorited: boolean;
}

/** 单集实体 */
export interface Episode {
  id: number;
  podcast_id: number;
  title: string;
  recommendation: string | null;
  listened: boolean;
}

/** 单集实体（含所属播客信息） */
export interface EpisodeWithPodcast {
  id: number;
  podcast_id: number;
  title: string;
  recommendation: string | null;
  podcast_name: string;
  listened: boolean;
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
}

/** 创建/更新单集表单 */
export interface EpisodeFormData {
  title: string;
  recommendation: string;
}

/** 平台统计数据 */
export interface PlatformStats {
  platform: string;
  podcast_count: number;
  avg_rating: number;
}

/** 统计概览数据 */
export interface Stats {
  total_podcasts: number;
  total_episodes: number;
  platform_stats: PlatformStats[];
}
