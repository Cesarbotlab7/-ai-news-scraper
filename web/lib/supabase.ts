import { createClient } from '@supabase/supabase-js'
import type { NewsItem } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function getFeedItems({
  limit,
  offset,
  sourceType,
}: {
  limit: number
  offset: number
  sourceType?: string
}): Promise<NewsItem[]> {
  let query = supabase
    .from('news_items')
    .select('*')
    .eq('is_representative', true)

  if (sourceType) {
    query = query.eq('source_type', sourceType)
  }

  const { data, error } = await query
    .order('importance_score', { ascending: false })
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) return []
  return data as NewsItem[]
}

export async function getItemByHash(hash: string): Promise<NewsItem | null> {
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('url_hash', hash)
    .single()

  if (error || !data) return null
  return data as NewsItem
}

export async function getClusterSiblings(
  clusterId: string | null,
  excludeHash: string,
): Promise<NewsItem[]> {
  if (!clusterId) return []

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('cluster_id', clusterId)
    .neq('url_hash', excludeHash)

  if (error || !data) return []
  return data as NewsItem[]
}
