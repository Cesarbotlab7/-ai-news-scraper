/**
 * 信源英文名 → 中文显示名映射
 * 覆盖 accounts.txt + rss_feeds.txt 中的全部英文信源
 */
const SOURCE_NAME_ZH: Record<string, string> = {
  // ── Tier 1 顶级人物 ────────────────────────────────────────────────
  'Sam Altman':         '山姆·奥特曼',
  'Mark Zuckerberg':    '马克·扎克伯格',
  'Demis Hassabis':     '德米斯·哈萨比斯',
  'Dario Amodei':       '达里奥·阿莫代伊',
  'Daniela Amodei':     '达妮拉·阿莫代伊',
  'Andrej Karpathy':    '安德烈·卡帕西',
  'Yann LeCun':         '杨立昆',
  'Geoffrey Hinton':    '杰弗里·辛顿',
  'Ilya Sutskever':     '伊利亚·苏茨科弗',
  'Andrew Ng':          '吴恩达',
  'Jeff Dean':          '杰夫·迪恩',
  'Fei-Fei Li':         '李飞飞',
  'Thomas Wolf':        '托马斯·沃尔夫',
  'Greg Brockman':      '格雷格·布罗克曼',
  'Elon Musk':          '埃隆·马斯克',

  // ── Tier 2 顶级机构 ────────────────────────────────────────────────
  'Google DeepMind':    '谷歌 DeepMind',
  'Google AI':          '谷歌 AI',
  'Meta AI':            'Meta AI',
  'NVIDIA':             '英伟达',
  'NVIDIA AI':          '英伟达 AI',
  'Alibaba Qwen':       '阿里通义千问',
  'ByteDance Research': '字节跳动研究院',
  'Hailuo AI':          '海螺 AI',
  'MIT CSAIL':          '麻省理工 CSAIL',

  // ── Tier 3 从业者（主要英文圈人物）─────────────────────────────────
  'Gary Marcus':        'Gary Marcus',
  'Eliezer Yudkowsky':  'Eliezer Yudkowsky',
  'Erik Brynjolfsson':  'Erik Brynjolfsson',

  // ── RSS 英文官方博客 ───────────────────────────────────────────────
  'OpenAI Blog':           'OpenAI 博客',
  'Anthropic News':        'Anthropic 新闻',
  'Google DeepMind Blog':  '谷歌 DeepMind 博客',
  'Meta AI Blog':          'Meta AI 博客',
  'NVIDIA AI Blog':        '英伟达 AI 博客',
  'Google AI Blog':        '谷歌 AI 博客',
  'Microsoft Research':    '微软研究院',

  // ── RSS 英文权威媒体 ───────────────────────────────────────────────
  'TechCrunch AI':         'TechCrunch AI',
  'MIT Technology Review': '麻省理工科技评论',
  'The Verge AI':          'The Verge AI',
  'Ars Technica':          'Ars Technica',
  'VentureBeat AI':        'VentureBeat AI',

  // ── HackerNews / arXiv（保留原名，已有中文标注）─────────────────────
  'Hacker News 热门':      'Hacker News 热门',
}

/**
 * 返回信源的中文显示名，无映射则返回原名
 */
export function formatSourceName(name: string | null | undefined): string {
  if (!name) return ''
  return SOURCE_NAME_ZH[name] ?? name
}
