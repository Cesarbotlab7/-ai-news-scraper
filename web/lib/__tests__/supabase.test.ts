import { describe, it, expect, vi, beforeEach } from 'vitest'

// 在 import 前 mock，让所有 import 都拿到 mock
vi.mock('@supabase/supabase-js', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => mockChain),
    })),
    __mockChain: mockChain,
  }
})

import * as supabaseJs from '@supabase/supabase-js'
import { getFeedItems, getItemByHash, getClusterSiblings } from '../supabase'

function getMock() {
  // @ts-expect-error mock helper
  return supabaseJs.__mockChain as Record<string, ReturnType<typeof vi.fn>>
}

const FAKE_ITEM = {
  url_hash: 'hash1',
  title: 'Test Article',
  source_display_name: 'Sam Altman',
  source_tier: 1,
  published_at: '2024-06-01T10:00:00Z',
  importance_score: 80,
  is_representative: true,
  cluster_count: 1,
  cluster_id: null,
  ai_summary_zh: null,
  recommendation_reason: null,
}

describe('getFeedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const m = getMock()
    m.select.mockReturnThis()
    m.eq.mockReturnThis()
    m.order.mockReturnThis()
    m.range.mockResolvedValue({ data: [FAKE_ITEM], error: null })
  })

  it('returns array of items', async () => {
    const items = await getFeedItems({ limit: 10, offset: 0 })
    expect(Array.isArray(items)).toBe(true)
    expect(items[0].url_hash).toBe('hash1')
  })

  it('returns empty array on error', async () => {
    getMock().range.mockResolvedValue({ data: null, error: { message: 'db error' } })
    const items = await getFeedItems({ limit: 10, offset: 0 })
    expect(items).toEqual([])
  })
})

describe('getItemByHash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const m = getMock()
    m.select.mockReturnThis()
    m.eq.mockReturnThis()
    m.single.mockResolvedValue({ data: FAKE_ITEM, error: null })
  })

  it('returns item for valid hash', async () => {
    const item = await getItemByHash('hash1')
    expect(item).not.toBeNull()
    expect(item?.url_hash).toBe('hash1')
  })

  it('returns null when not found', async () => {
    getMock().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const item = await getItemByHash('nonexistent')
    expect(item).toBeNull()
  })
})

describe('getClusterSiblings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const m = getMock()
    m.select.mockReturnThis()
    m.eq.mockReturnThis()
    m.neq.mockResolvedValue({ data: [FAKE_ITEM], error: null })
  })

  it('returns siblings for valid clusterId', async () => {
    const siblings = await getClusterSiblings('cluster-1', 'hash-rep')
    expect(Array.isArray(siblings)).toBe(true)
  })

  it('returns empty array immediately when clusterId is null', async () => {
    const siblings = await getClusterSiblings(null, 'hash-rep')
    expect(siblings).toEqual([])
    // 不应该调用 eq（不查库）
    expect(getMock().eq).not.toHaveBeenCalled()
  })

  it('returns empty array on db error', async () => {
    getMock().neq.mockResolvedValue({ data: null, error: { message: 'error' } })
    const siblings = await getClusterSiblings('cluster-1', 'hash-rep')
    expect(siblings).toEqual([])
  })
})
