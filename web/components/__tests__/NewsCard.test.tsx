import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewsCard from '../NewsCard'
import type { NewsItem } from '@/lib/types'

const BASE_ITEM: NewsItem = {
  url_hash: 'abc123',
  source_type: 'twitter',
  source_handle: 'sama',
  source_display_name: 'Sam Altman',
  source_tier: 1,
  title: 'GPT-5 will be released this quarter',
  content: 'Full content here.',
  url: 'https://x.com/sama/status/1',
  language: 'en',
  published_at: '2024-06-01T10:00:00Z',
  fetched_at: '2024-06-01T10:05:00Z',
  importance_score: 85,
  cluster_id: 'cluster-1',
  is_representative: true,
  cluster_count: 1,
  cluster_sources: null,
  ai_summary_zh: null,
  recommendation_reason: null,
}

describe('NewsCard', () => {
  const NOW = new Date('2024-06-01T12:00:00Z')

  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders title', () => {
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.getByText('GPT-5 will be released this quarter')).toBeInTheDocument()
  })

  it('renders source_display_name in Chinese when mapping exists', () => {
    render(<NewsCard item={BASE_ITEM} />)
    // Sam Altman → 山姆·奥特曼 via sourceNames mapping
    expect(screen.getByText('山姆·奥特曼')).toBeInTheDocument()
  })

  it('renders importance_score via formatScore', () => {
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('renders time ago', () => {
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.getByText('2小时前')).toBeInTheDocument()
  })

  it('renders source initials badge', () => {
    // 新设计用首字母徽章替代了 SourceBadge tier 标签
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.getByText('SA')).toBeInTheDocument()
  })

  it('wraps card in a link to /news/[url_hash]', () => {
    render(<NewsCard item={BASE_ITEM} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/news/abc123')
  })

  it('renders ai_summary_zh when present', () => {
    const item = { ...BASE_ITEM, ai_summary_zh: '奥特曼暗示GPT-5本季度发布' }
    render(<NewsCard item={item} />)
    expect(screen.getByText('奥特曼暗示GPT-5本季度发布')).toBeInTheDocument()
  })

  it('does not render summary section when ai_summary_zh is null', () => {
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.queryByTestId('summary')).not.toBeInTheDocument()
  })

  it('renders cluster_count > 1 as "另有N个源报道"', () => {
    // cluster_count是总数（含代表条目），显示的是其余数量 = 10-1=9
    const item = { ...BASE_ITEM, cluster_count: 10 }
    render(<NewsCard item={item} />)
    expect(screen.getByText('另有 9 个源报道了此事件')).toBeInTheDocument()
  })

  it('does not render cluster line when cluster_count is 1', () => {
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.queryByText(/另有/)).not.toBeInTheDocument()
  })

  it('renders recommendation_reason when present', () => {
    const item = { ...BASE_ITEM, recommendation_reason: 'GPT-5发布将重塑开发者工作流' }
    render(<NewsCard item={item} />)
    expect(screen.getByText('GPT-5发布将重塑开发者工作流')).toBeInTheDocument()
  })

  it('does not render reason section when recommendation_reason is null', () => {
    render(<NewsCard item={BASE_ITEM} />)
    expect(screen.queryByTestId('reason')).not.toBeInTheDocument()
  })

  it('falls back to content when title is empty string', () => {
    const item = { ...BASE_ITEM, title: '', content: 'Tweet content here goes on and on.' }
    render(<NewsCard item={item} />)
    expect(screen.getByText(/Tweet content here/)).toBeInTheDocument()
  })

  it('falls back to fetched_at when published_at is null', () => {
    const item = {
      ...BASE_ITEM,
      published_at: null,
      fetched_at: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
    }
    render(<NewsCard item={item} />)
    expect(screen.getByText('1小时前')).toBeInTheDocument()
  })
})
