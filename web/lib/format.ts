export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`

  return date.toISOString().slice(0, 10)
}

export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')   // 去掉图片 ![alt](url)
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // 链接 [text](url) → text
    .replace(/\s+/g, ' ')              // 合并多余空白
    .trim()
}

export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return ''
  if (score >= 100) return '99+'
  return String(Math.round(score))
}
