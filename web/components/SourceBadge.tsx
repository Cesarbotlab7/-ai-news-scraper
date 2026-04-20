import type { SourceTier } from '@/lib/types'

const TIER_CONFIG: Record<SourceTier, { label: string; className: string }> = {
  1: { label: '顶级人物', className: 'tier-1 bg-violet-100 text-violet-800' },
  2: { label: '顶级机构', className: 'tier-2 bg-blue-100 text-blue-800' },
  3: { label: '从业者', className: 'tier-3 bg-green-100 text-green-700' },
  4: { label: '社区', className: 'tier-4 bg-gray-100 text-gray-600' },
}

export default function SourceBadge({ tier }: { tier: SourceTier | null }) {
  if (!tier || !(tier in TIER_CONFIG)) return null
  const { label, className } = TIER_CONFIG[tier]
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
