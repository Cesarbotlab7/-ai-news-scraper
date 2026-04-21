import Link from 'next/link'
import { getFeedItems } from '@/lib/supabase'
import NewsCard from '@/components/NewsCard'
import type { NewsItem } from '@/lib/types'

export const revalidate = 900

const SOURCE_CHIPS = [
  { label: '全部', value: '' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'RSS', value: 'rss' },
  { label: 'HN', value: 'hackernews' },
  { label: 'arXiv', value: 'arxiv' },
]

function getShanghaDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { timeZone: 'Asia/Shanghai' })
}

function formatDayLabel(dateKey: string): string {
  const today = new Date().toLocaleDateString('fr-CA', { timeZone: 'Asia/Shanghai' })
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  if (dateKey === today) return `今天 · ${mm}.${dd} ${DAYS[date.getDay()]}`
  return `${mm}.${dd} ${DAYS[date.getDay()]}`
}

function groupByDay(items: NewsItem[]): { label: string; items: NewsItem[] }[] {
  const groups = new Map<string, NewsItem[]>()
  for (const item of items) {
    const iso = item.published_at ?? item.fetched_at
    if (!iso) continue
    const key = getShanghaDateKey(iso)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({ label: formatDayLabel(key), items }))
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface SortTabProps {
  href: string
  active: boolean
  children: React.ReactNode
}

function SortTab({ href, active, children }: SortTabProps) {
  return (
    <Link
      href={href}
      className="text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors"
      style={{
        padding: '10px 14px 11px',
        color: active ? '#e6e9f2' : 'var(--text-dim)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {children}
    </Link>
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string; nav?: string }>
}) {
  const { tab = '', sort = '', nav = 'featured' } = await searchParams
  const sortParam = sort === 'time' ? 'time' : 'score'
  const representativeOnly = nav !== 'all'

  const items = await getFeedItems({
    limit: 50,
    offset: 0,
    sourceType: tab || undefined,
    sort: sortParam,
    representativeOnly,
  })

  const groups = groupByDay(items)
  const navTitle = nav === 'all' ? '全部AI动态' : '精选'

  const buildHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { nav, sort, tab, ...overrides }
    if (merged.nav && merged.nav !== 'featured') params.set('nav', merged.nav)
    if (merged.sort && merged.sort !== 'score') params.set('sort', merged.sort)
    if (merged.tab) params.set('tab', merged.tab)
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  return (
    <div className="px-4 sm:px-10 pb-[120px] max-w-[920px]">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(15,17,23,0.96) 60%, rgba(15,17,23,0))',
          backdropFilter: 'blur(8px)',
          padding: '26px 0 0',
          marginBottom: 4,
        }}
      >
        <div className="flex items-end gap-4 mb-[18px] flex-wrap">
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '0.01em', color: '#f1f4fb' }}>
            {navTitle}
          </h1>
          <span
            className="inline-flex items-center gap-2 pb-1"
            style={{ color: 'var(--text-mute)', fontSize: 12.5, letterSpacing: '0.04em' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)', animation: 'pulse 1.6s ease-in-out infinite' }}
            />
            实时聚合 · {items.length} 条
          </span>
          <div
            className="ml-auto hidden sm:flex items-center gap-2"
            style={{
              background: 'rgba(20,25,37,0.5)',
              border: '1px solid var(--line-soft)',
              padding: '7px 12px',
              borderRadius: 10,
              color: 'var(--text-dim)',
              fontSize: 12.5,
              minWidth: 200,
            }}
          >
            <SearchIcon />
            <span>搜索事件、信源或关键词</span>
          </div>
        </div>

        {/* Sort tabs + source chips */}
        <div
          className="flex items-center gap-1 flex-wrap"
          style={{ borderBottom: '1px solid var(--line-soft)' }}
        >
          <SortTab href={buildHref({ sort: 'score' })} active={sortParam === 'score'}>
            热度排序
          </SortTab>
          <SortTab href={buildHref({ sort: 'time' })} active={sortParam === 'time'}>
            时间线
          </SortTab>

          <div className="ml-auto flex gap-2 items-center pb-1.5 flex-wrap">
            {SOURCE_CHIPS.map((chip) => {
              const isActive = tab === chip.value
              return (
                <Link
                  key={chip.value}
                  href={buildHref({ tab: chip.value })}
                  className="text-[11.5px] px-2.5 py-1 rounded-full inline-flex items-center transition-all"
                  style={{
                    border: `1px solid ${isActive ? 'rgba(0,212,170,0.35)' : 'var(--line-soft)'}`,
                    background: isActive ? 'rgba(0,212,170,0.10)' : 'transparent',
                    color: isActive ? '#a0ecd6' : 'var(--text-dim)',
                  }}
                >
                  {chip.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-mute)' }}>
          <p>暂无资讯</p>
          <p className="text-sm mt-1">抓取器将在3小时内更新数据</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <div
              className="flex items-center gap-3 mt-7 mb-1"
              style={{
                color: 'var(--text-mute)',
                fontSize: 11,
                letterSpacing: '0.18em',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              <span>{group.label}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
            </div>

            {group.items.map((item, i) => (
              <NewsCard
                key={item.url_hash}
                item={item}
                isLast={i === group.items.length - 1}
              />
            ))}
          </div>
        ))
      )}

      <div
        className="flex items-center gap-2.5 mt-10"
        style={{ paddingLeft: 110, color: 'var(--text-mute)', fontSize: 12 }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-mute)', flexShrink: 0 }} />
        已到末尾 · 继续向下查看更多动态
      </div>
    </div>
  )
}
