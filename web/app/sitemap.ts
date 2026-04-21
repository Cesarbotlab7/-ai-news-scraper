import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'http://124.222.23.162'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('news_items')
    .select('url_hash, fetched_at')
    .eq('is_representative', true)
    .order('fetched_at', { ascending: false })
    .limit(1000)

  const articles: MetadataRoute.Sitemap = (data ?? []).map((item) => ({
    url: `${BASE_URL}/news/${item.url_hash}`,
    lastModified: new Date(item.fetched_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    ...articles,
  ]
}
