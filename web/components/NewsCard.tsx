import Link from 'next/link'
import type { NewsItem } from '@/lib/types'
import { formatScore, stripMarkdown, timeAgo } from '@/lib/format'
import { formatSourceName } from '@/lib/sourceNames'

function getSourceBadge(name: string | null): string {
  if (!name) return '?'
  const words = name.trim().split(/[\s_\-·/]+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatHHMM(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai',
    })
  } catch {
    return ''
  }
}

function scoreStyle(n: number | null): React.CSSProperties {
  if (n === null || n === undefined) {
    return { color: '#c6cbd8', background: '#232a3c', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }
  }
  if (n >= 90) return { color: '#08121a', background: 'linear-gradient(135deg,#00e8b7,#00a4ff)', boxShadow: '0 0 24px rgba(0,212,170,0.35)' }
  if (n >= 80) return { color: '#d9fff4', background: 'linear-gradient(135deg,#0f3b34,#0a5a4a)', boxShadow: '0 0 0 1px rgba(0,212,170,0.35) inset' }
  if (n >= 70) return { color: '#d6e4ff', background: 'linear-gradient(135deg,#14233f,#1b3358)', boxShadow: '0 0 0 1px rgba(76,141,255,0.35) inset' }
  return { color: '#c6cbd8', background: '#232a3c', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }
}

function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14H11L10 22L20 10H13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function ChevIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c1 3 4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 2-4-1 0-2-1-2-3 2 0 4-1 4-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

export default function NewsCard({
  item,
  isLast = false,
}: {
  item: NewsItem
  isLast?: boolean
}) {
  const displayTitle = item.title || stripMarkdown(item.content)?.slice(0, 120) || ''
  const displayTime = item.published_at ?? item.fetched_at
  const score = item.importance_score
  const isLive = score !== null && score >= 90
  const relTime = timeAgo(displayTime)
  const hhMM = formatHHMM(displayTime)
  const badge = getSourceBadge(item.source_display_name)
  const displaySourceName = formatSourceName(item.source_display_name)
  const sStyle = scoreStyle(score)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', position: 'relative' }}>
      {/* Time column */}
      <div style={{ position: 'relative', paddingTop: 20, paddingRight: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
          {hhMM}
        </span>
        {relTime && (
          <time dateTime={displayTime!} style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 4, letterSpacing: '0.04em' }}>
            {relTime}
          </time>
        )}
        {/* Rail */}
        <span style={{ position: 'absolute', right: -1, top: 0, bottom: isLast ? 0 : -24, width: 1, background: 'var(--line)' }} />
        {/* Dot */}
        <span style={{
          position: 'absolute', right: -5, top: 24,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 0 3px rgba(0,212,170,0.15), 0 0 14px rgba(0,212,170,0.55)',
        }} />
      </div>

      {/* Card */}
      <Link
        href={`/news/${item.url_hash}`}
        className="block overflow-hidden transition-all duration-150 hover:-translate-y-px"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line-soft)',
          borderRadius: 14,
          margin: '12px 0 20px 20px',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-[18px] pt-4 mb-2.5">
          <div
            className="flex items-center justify-center text-[9.5px] font-bold tracking-wide shrink-0"
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'linear-gradient(135deg,#2a3250,#1a1f33)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#b9c2d6',
            }}
          >
            {badge}
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>
            {displaySourceName}
          </span>
          <span className="shrink-0" style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-mute)' }} />
          {isLive && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em]"
              style={{ color: 'var(--accent)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'pulse 1.6s ease-in-out infinite' }}
              />
              LIVE
            </span>
          )}
          <div
            className="ml-auto inline-flex items-center justify-center gap-1 font-bold shrink-0"
            style={{ ...sStyle, minWidth: 44, height: 32, padding: '0 10px', borderRadius: 10, fontSize: 15 }}
          >
            {isLive && <FireIcon />}
            {formatScore(score)}
          </div>
        </div>

        {/* Body */}
        <div className="px-[18px]">
          <h2 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45, color: '#eef1f8', letterSpacing: '0.005em', margin: '2px 0 8px' }}>
            {displayTitle}
          </h2>

          {item.ai_summary_zh && (
            <p data-testid="summary" style={{ fontSize: 13.5, lineHeight: 1.65, color: '#b6bfd3', marginBottom: 12 }}>
              {item.ai_summary_zh}
            </p>
          )}

          {item.title && !item.ai_summary_zh && item.content && (
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#b6bfd3', marginBottom: 12 }}>
              {stripMarkdown(item.content).slice(0, 200)}
            </p>
          )}
        </div>

        {/* Cluster row */}
        {item.cluster_count && item.cluster_count > 1 && (
          <div className="px-[18px] inline-flex items-center gap-1.5 mb-2.5">
            <span style={{ color: '#6b9dff', fontSize: 12 }}>
              另有 {item.cluster_count - 1} 个源报道了此事件
            </span>
            <ChevIcon />
          </div>
        )}

        {/* Recommendation */}
        {item.recommendation_reason && (
          <div
            data-testid="reason"
            className="flex gap-3 items-start"
            style={{
              marginTop: 4,
              padding: '12px 18px 14px',
              borderTop: '1px solid rgba(0,212,170,0.30)',
              background: 'linear-gradient(180deg, rgba(0,212,170,0.10), rgba(0,212,170,0.04))',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0 mt-0.5"
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'rgba(0,212,170,0.13)',
                border: '1px solid rgba(0,212,170,0.27)',
                color: 'var(--accent)',
              }}
            >
              <BoltIcon />
            </div>
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-1.5 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: '#7be8c9' }}
              >
                <span style={{ display: 'inline-block', width: 14, height: 1, background: 'var(--accent)', opacity: 0.6 }} />
                推荐理由
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: '#d4dcef' }}>
                {item.recommendation_reason}
              </div>
            </div>
          </div>
        )}
      </Link>
    </div>
  )
}
