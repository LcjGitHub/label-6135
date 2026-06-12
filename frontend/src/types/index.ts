/** 播客实体 */
export interface Podcast {
  id: number;
  name: string;
  platform: string;
  theme: string;
  rating: number;
  notes: string | null;
}

/** 单集实体 */
export interface Episode {
  id: number;
  podcast_id: number;
  title: string;
  recommendation: string | null;
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
