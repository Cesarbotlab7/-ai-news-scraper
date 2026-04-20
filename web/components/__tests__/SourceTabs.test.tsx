import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SourceTabs from '../SourceTabs'

describe('SourceTabs', () => {
  it('renders all tab labels', () => {
    render(<SourceTabs activeTab="" />)
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('Twitter / X')).toBeInTheDocument()
    expect(screen.getByText('RSS')).toBeInTheDocument()
    expect(screen.getByText('HackerNews')).toBeInTheDocument()
    expect(screen.getByText('arXiv')).toBeInTheDocument()
  })

  it('marks 全部 as active (aria-current=page) when activeTab is empty', () => {
    render(<SourceTabs activeTab="" />)
    const link = screen.getByText('全部').closest('a')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('marks twitter tab as active when activeTab is twitter', () => {
    render(<SourceTabs activeTab="twitter" />)
    const link = screen.getByText('Twitter / X').closest('a')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark 全部 as active when another tab is active', () => {
    render(<SourceTabs activeTab="rss" />)
    const link = screen.getByText('全部').closest('a')
    expect(link).not.toHaveAttribute('aria-current')
  })

  it('links 全部 tab to /', () => {
    render(<SourceTabs activeTab="" />)
    const link = screen.getByText('全部').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('links twitter tab to /?tab=twitter', () => {
    render(<SourceTabs activeTab="" />)
    const link = screen.getByText('Twitter / X').closest('a')
    expect(link).toHaveAttribute('href', '/?tab=twitter')
  })

  it('links rss tab to /?tab=rss', () => {
    render(<SourceTabs activeTab="" />)
    const link = screen.getByText('RSS').closest('a')
    expect(link).toHaveAttribute('href', '/?tab=rss')
  })

  it('links hackernews tab to /?tab=hackernews', () => {
    render(<SourceTabs activeTab="" />)
    const link = screen.getByText('HackerNews').closest('a')
    expect(link).toHaveAttribute('href', '/?tab=hackernews')
  })

  it('links arxiv tab to /?tab=arxiv', () => {
    render(<SourceTabs activeTab="" />)
    const link = screen.getByText('arXiv').closest('a')
    expect(link).toHaveAttribute('href', '/?tab=arxiv')
  })
})
