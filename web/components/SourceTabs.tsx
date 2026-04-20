import Link from 'next/link'

const TABS = [
  { label: '全部', value: '' },
  { label: 'Twitter / X', value: 'twitter' },
  { label: 'RSS', value: 'rss' },
  { label: 'HackerNews', value: 'hackernews' },
  { label: 'arXiv', value: 'arxiv' },
]

export default function SourceTabs({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value
        return (
          <Link
            key={tab.value}
            href={tab.value ? `/?tab=${tab.value}` : '/'}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? 'px-3 py-1 rounded-full text-sm font-medium bg-gray-900 text-white'
                : 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
