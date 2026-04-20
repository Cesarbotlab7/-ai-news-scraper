export type SourceTier = 1 | 2 | 3 | 4

export interface NewsItem {
  url_hash: string
  source_type: string | null
  source_handle: string | null
  source_display_name: string | null
  source_tier: SourceTier | null
  title: string | null
  content: string | null
  url: string | null
  language: string | null
  published_at: string | null
  fetched_at: string | null
  importance_score: number | null
  cluster_id: string | null
  is_representative: boolean | null
  cluster_count: number | null
  cluster_sources: string[] | null
  ai_summary_zh: string | null
  recommendation_reason: string | null
}
