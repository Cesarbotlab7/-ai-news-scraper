import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SourceBadge from '../SourceBadge'

describe('SourceBadge', () => {
  it('shows "顶级人物" for tier 1', () => {
    render(<SourceBadge tier={1} />)
    expect(screen.getByText('顶级人物')).toBeInTheDocument()
  })

  it('shows "顶级机构" for tier 2', () => {
    render(<SourceBadge tier={2} />)
    expect(screen.getByText('顶级机构')).toBeInTheDocument()
  })

  it('shows "从业者" for tier 3', () => {
    render(<SourceBadge tier={3} />)
    expect(screen.getByText('从业者')).toBeInTheDocument()
  })

  it('shows "社区" for tier 4', () => {
    render(<SourceBadge tier={4} />)
    expect(screen.getByText('社区')).toBeInTheDocument()
  })

  it('renders nothing for null tier', () => {
    const { container } = render(<SourceBadge tier={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('tier 1 has a distinct accent class', () => {
    render(<SourceBadge tier={1} />)
    const badge = screen.getByText('顶级人物')
    expect(badge.className).toMatch(/tier-1|purple|violet|indigo/)
  })
})
