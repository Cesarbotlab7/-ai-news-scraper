import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Sidebar from '../Sidebar'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}))

describe('Sidebar', () => {
  it('renders unfinished source entries as disabled, not links', () => {
    const { container } = render(<Sidebar />)

    expect(container.querySelector('a[href="/?nav=sources"]')).toBeNull()
    expect(container.querySelector('a[href="/?nav=submit"]')).toBeNull()
    expect(screen.getAllByText('规划中')).toHaveLength(2)
  })
})
