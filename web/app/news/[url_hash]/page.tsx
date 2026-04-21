import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getItemByHash, getClusterSiblings } from '@/lib/supabase'
import TimeAgo from '@/components/TimeAgo'
import { formatScore, stripMarkdown } from '@/lib/format'
import { formatSourceName } from '@/lib/sourceNames'

export const revalidate = 900

export async function generateMetadata({
  params,
}: {
  params: Promise<{ url_hash: string }>
}): Promise<Metadata> {
  const { url_hash } = await params
  const item = await getItemByHash(url_hash)
  if (!item) return {}

  const title = item.ai_summary_zh || item.title || stripMarkdown(item.content)?.slice(0, 80) || 'AI资讯'
  const description = item.ai_summary_zh || stripMarkdown(item.content)?.slice(0, 160) || ''

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
  }
}

export default async function DetailPage({
  params,
}: {
  params: Promise<{ url_hash: string }>
}) {
  const { url_hash } = await params
  const item = await getItemByHash(url_hash)
  if (!item) notFound()

  const siblings = await getClusterSiblings(item.cluster_id, url_hash)
  const displayTitle = item.title || stripMarkdown(item.content)?.slice(0, 120) || ''

  return (
    <div className="px-4 sm:px-10 py-8 max-w-[860px]">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-mute)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        返回
      </Link>

      <article
        className="rounded-[14px] overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--line-soft)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-0 mb-3" style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          <span className="font-medium" style={{ color: '#e6e9f2' }}>{formatSourceName(item.source_display_name)}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-mute)', flexShrink: 0 }} />
          <TimeAgo iso={item.published_at ?? item.fetched_at} />
          <span className="ml-auto font-semibold" style={{ color: '#e6e9f2' }}>{formatScore(item.importance_score)}</span>
        </div>

        <div className="px-6 pb-2">
          {item.ai_summary_zh ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#eef1f8', lineHeight: 1.45, margin: '0 0 8px' }}>
                {item.ai_summary_zh}
              </h1>
              <p style={{ fontSize: 13, color: '#6b7592', marginBottom: 16 }}>
                {displayTitle}
              </p>
            </>
          ) : (
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#eef1f8', lineHeight: 1.45, margin: '0 0 16px' }}>
              {displayTitle}
            </h1>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.slice(0, 5).map((tag) => (
                <span key={tag} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#8b95ad' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.recommendation_reason && (
            <p className="text-sm italic mb-4" style={{ color: 'var(--text-dim)' }}>
              推荐理由：{item.recommendation_reason}
            </p>
          )}

          {item.content && (
            <div className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: '#b6bfd3' }}>
              {item.content}
            </div>
          )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm mb-6 hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              查看原文 →
            </a>
          )}
        </div>

        {siblings.length > 0 && (
          <section
            className="px-6 py-4"
            style={{ borderTop: '1px solid var(--line-soft)' }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-mute)' }}
            >
              同一事件的其他报道 ({siblings.length})
            </p>
            <ul className="flex flex-col gap-2">
              {siblings.map((s) => (
                <li key={s.url_hash} className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm">
                  <span style={{ color: '#e6e9f2' }}>{formatSourceName(s.source_display_name)}</span>
                  <TimeAgo iso={s.published_at ?? s.fetched_at} />
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs hover:underline"
                      style={{ color: 'var(--accent)' }}
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
    </div>
  )
}
