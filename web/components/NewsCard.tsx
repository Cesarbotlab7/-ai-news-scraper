import Link from 'next/link'
import type { NewsItem } from '@/lib/types'
import { formatScore, stripMarkdown } from '@/lib/format'
import SourceBadge from './SourceBadge'
import TimeAgo from './TimeAgo'

export default function NewsCard({ item }: { item: NewsItem }) {
  const displayTitle = item.title || stripMarkdown(item.content)?.slice(0, 120) || ''
  const displayTime = item.published_at ?? item.fetched_at

  return (
    <Link href={`/news/${item.url_hash}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <span className="font-medium text-gray-800">{item.source_display_name}</span>
        <SourceBadge tier={item.source_tier} />
        <TimeAgo iso={displayTime} />
        <span className="ml-auto font-semibold text-gray-700">{formatScore(item.importance_score)}</span>
      </div>

      <h2 className="text-base font-semibold text-gray-900 leading-snug mb-2">
        {displayTitle}
      </h2>

      {item.ai_summary_zh && (
        <p data-testid="summary" className="text-sm text-gray-600 mb-2">
          {item.ai_summary_zh}
        </p>
      )}

      {item.cluster_count && item.cluster_count > 1 && (
        <p className="text-xs text-blue-600 mb-1">
          另有 {item.cluster_count - 1} 个源报道了此事件
        </p>
      )}

      {item.recommendation_reason && (
        <p data-testid="reason" className="text-xs text-gray-500 italic">
          {item.recommendation_reason}
        </p>
      )}
    </Link>
  )
}
