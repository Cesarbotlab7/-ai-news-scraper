import { timeAgo } from '@/lib/format'

export default function TimeAgo({ iso }: { iso: string | null }) {
  const text = timeAgo(iso)
  if (!text) return null
  return <time dateTime={iso!}>{text}</time>
}
