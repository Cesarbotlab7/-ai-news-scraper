import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TimeAgo from '../TimeAgo'

describe('TimeAgo', () => {
  const NOW = new Date('2024-06-01T12:00:00Z')

  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders formatted text from iso string', () => {
    const iso = new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString()
    render(<TimeAgo iso={iso} />)
    expect(screen.getByText('2小时前')).toBeInTheDocument()
  })

  it('sets dateTime attribute on <time> element', () => {
    const iso = new Date(NOW.getTime() - 60 * 1000).toISOString()
    render(<TimeAgo iso={iso} />)
    const el = screen.getByRole('time')
    expect(el).toHaveAttribute('dateTime', iso)
  })

  it('renders nothing for null iso', () => {
    const { container } = render(<TimeAgo iso={null} />)
    expect(container.firstChild).toBeNull()
  })
})
