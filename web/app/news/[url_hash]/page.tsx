import { notFound } from 'next/navigation'
import { getItemByHash, getClusterSiblings } from '@/lib/supabase'
import SourceBadge from '@/components/SourceBadge'
import TimeAgo from '@/components/TimeAgo'
import { formatScore } from '@/lib/format'

export const revalidate = 900

export default async function DetailPage({
  params,
}: {
  params: Promise<{ url_hash: string }>
}) {
  const { url_hash } = await params
  const item = await getItemByHash(url_hash)
  if (!item) notFound()

  const siblings = await getClusterSiblings(item.cluster_id, url_hash)

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span className="font-medium text-gray-800">{item.source_display_name}</span>
        <SourceBadge tier={item.source_tier} />
        <TimeAgo iso={item.published_at} />
        <span className="ml-auto font-semibold text-gray-700">{formatScore(item.importance_score)}</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 leading-snug mb-4">
        {item.title}
      </h1>

      {item.ai_summary_zh && (
        <div className="bg-blue-50 rounded p-3 mb-4">
          <p className="text-sm font-medium text-blue-800 mb-1">摘要</p>
          <p className="text-sm text-blue-900">{item.ai_summary_zh}</p>
        </div>
      )}

      {item.recommendation_reason && (
        <p className="text-sm text-gray-500 italic mb-4">推荐理由：{item.recommendation_reason}</p>
      )}

      {item.content && (
        <div className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
          {item.content}
        </div>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 hover:underline mb-6"
        >
          查看原文 →
        </a>
      )}

      {siblings.length > 0 && (
        <section className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-3">
            另有 {siblings.length} 个源也报道了此事件
          </p>
          <ul className="flex flex-col gap-2">
            {siblings.map((s) => (
              <li key={s.url_hash} className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">{s.source_display_name}</span>
                <SourceBadge tier={s.source_tier} />
                <TimeAgo iso={s.published_at} />
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-blue-500 hover:underline text-xs"
                  >
                    原文
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
