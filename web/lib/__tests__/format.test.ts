import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { timeAgo, formatScore, stripMarkdown } from '../format'

describe('timeAgo', () => {
  const NOW = new Date('2024-06-01T12:00:00Z')

  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "X分钟前" when less than 1 hour ago', () => {
    const iso = new Date(NOW.getTime() - 30 * 60 * 1000).toISOString()
    expect(timeAgo(iso)).toBe('30分钟前')
  })

  it('returns "1分钟前" for exactly 1 minute ago', () => {
    const iso = new Date(NOW.getTime() - 60 * 1000).toISOString()
    expect(timeAgo(iso)).toBe('1分钟前')
  })

  it('returns "X小时前" when less than 24 hours ago', () => {
    const iso = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(iso)).toBe('3小时前')
  })

  it('returns "X天前" when less than 7 days ago', () => {
    const iso = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(iso)).toBe('3天前')
  })

  it('returns "YYYY-MM-DD" when 7 or more days ago', () => {
    const iso = new Date('2024-05-01T08:00:00Z').toISOString()
    expect(timeAgo(iso)).toBe('2024-05-01')
  })

  it('returns empty string for null', () => {
    expect(timeAgo(null)).toBe('')
  })

  it('returns empty string for invalid date string', () => {
    expect(timeAgo('not-a-date')).toBe('')
  })
})

describe('stripMarkdown', () => {
  it('removes image syntax, keeps nothing', () => {
    // stripMarkdown imported at top
    expect(stripMarkdown('![alt](https://example.com/img.jpg) text')).toBe('text')
  })

  it('replaces link syntax with link text only', () => {
    // stripMarkdown imported at top
    expect(stripMarkdown('[Sam Altman](https://x.com/sama) reposted')).toBe('Sam Altman reposted')
  })

  it('handles nested: image inside link', () => {
    // stripMarkdown imported at top
    const input = '[![Image](https://img.url)](https://x.com/link) text'
    expect(stripMarkdown(input)).toBe('text')
  })

  it('returns empty string for null/undefined', () => {
    // stripMarkdown imported at top
    expect(stripMarkdown(null)).toBe('')
    expect(stripMarkdown(undefined)).toBe('')
  })

  it('collapses extra whitespace', () => {
    // stripMarkdown imported at top
    expect(stripMarkdown('hello   world')).toBe('hello world')
  })
})

describe('formatScore', () => {
  it('returns integer as string for normal scores', () => {
    expect(formatScore(75)).toBe('75')
    expect(formatScore(50)).toBe('50')
  })

  it('returns "99+" for scores 100 or above', () => {
    expect(formatScore(100)).toBe('99+')
    expect(formatScore(150)).toBe('99+')
  })

  it('returns "0" for zero', () => {
    expect(formatScore(0)).toBe('0')
  })

  it('returns rounded integer for fractional score', () => {
    expect(formatScore(75.7)).toBe('76')
  })

  it('returns empty string for null', () => {
    expect(formatScore(null)).toBe('')
  })
})
