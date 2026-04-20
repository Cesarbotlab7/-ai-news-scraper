import { getFeedItems } from '@/lib/supabase'
import NewsCard from '@/components/NewsCard'

export const revalidate = 900

export default async function HomePage() {
  const items = await getFeedItems({ limit: 30, offset: 0 })

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-20">
        <p className="text-lg">暂无资讯</p>
        <p className="text-sm mt-1">抓取器将在3小时内更新数据</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <NewsCard key={item.url_hash} item={item} />
      ))}
    </div>
  )
}
