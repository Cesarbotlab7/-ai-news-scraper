import { getFeedItems } from '@/lib/supabase'
import NewsCard from '@/components/NewsCard'
import SourceTabs from '@/components/SourceTabs'

export const revalidate = 900

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = '' } = await searchParams
  const items = await getFeedItems({ limit: 30, offset: 0, sourceType: tab || undefined })

  return (
    <>
      <SourceTabs activeTab={tab} />
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <p className="text-lg">暂无资讯</p>
          <p className="text-sm mt-1">抓取器将在3小时内更新数据</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <NewsCard key={item.url_hash} item={item} />
          ))}
        </div>
      )}
    </>
  )
}
