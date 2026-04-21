# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 版本警告

此项目使用 **Next.js 16**，与训练数据中的 Next.js 14 有破坏性变更。修改任何路由或数据获取代码前，先读 `node_modules/next/dist/docs/` 中的对应文档。

最关键的变更：
- **`params` 和 `searchParams` 都是 Promise**：必须 `await` 才能解构，不能直接解构
  ```tsx
  // ✅ 正确（动态路由参数）
  const { url_hash } = await params
  // ✅ 正确（查询字符串，首页信源过滤用）
  const { tab = '', sort = '', nav = 'featured' } = await searchParams
  // ❌ 错误（Next.js 14 写法）
  const { url_hash } = params
  ```
- **缓存默认关闭**：`fetch` 不再自动缓存。用 `'use cache'` 指令或 `export const revalidate = N`（旧模型）

## 常用命令

```bash
# 开发服务器
npm run dev

# 运行所有测试
npm run test:run

# 运行单个测试文件
npx vitest run components/__tests__/NewsCard.test.tsx
npx vitest run lib/__tests__/format.test.ts

# 监听模式（开发时跑测试）
npm run test

# 生产构建（TypeScript 检查）
npm run build
```

## 架构

### 布局（`app/layout.tsx`）

```
<body>
  <Suspense fallback={skeleton}>
    <Sidebar />        ← 'use client'，用 useSearchParams 读 nav param
  </Suspense>
  <div>{children}</div>
</body>
```

`Sidebar` 必须在 `<Suspense>` 内，因为 `useSearchParams` 在服务端渲染会挂起。

### 数据流

```
Supabase (news_items 表)
  ↓ anon key + RLS（SELECT 对 anon 全开）
lib/supabase.ts     → getFeedItems({ limit, offset, sourceType?, sort?, representativeOnly? })
                    → getItemByHash(hash)
                    → getClusterSiblings(clusterId, excludeHash)
  ↓
app/page.tsx        → 首页（读 nav/sort/tab searchParams，ISR 15分钟）
app/news/[url_hash]/page.tsx → 详情页（ISR 15分钟）
  ↓
components/Sidebar  → 左侧导航（'use client'，精选/全部AI动态/信源/信源提报）
components/NewsCard → 时间线卡片（左列时间 + 右侧卡片，含 cluster/推荐理由）
components/TimeAgo  → iso → "X小时前"
components/SourceBadge/SourceTabs → 已存在但首页不再使用 Tab 组件（直接内联）
```

### 首页 Query Params（`app/page.tsx`）

| param | 默认 | 含义 |
|-------|------|------|
| `nav` | `featured` | `featured`=精选(is_representative=true)，`all`=全部 |
| `sort` | `score` | `score`=热度排序，`time`=时间线 |
| `tab` | `''` | 信源过滤：`twitter`/`rss`/`hackernews`/`arxiv` |

`buildHref(overrides)` 是首页内部的辅助函数，合并当前三个 param 后输出新 URL，避免切换一个 param 时丢失其他。

### `getFeedItems` 参数（`lib/supabase.ts`）

```ts
getFeedItems({
  limit: number
  offset: number
  sourceType?: string         // 过滤 source_type 字段
  sort?: 'score' | 'time'    // 主排序字段：importance_score 或 published_at
  representativeOnly?: boolean // 默认 true，false 时展示全部条目
})
```

排序逻辑：主排序按 `sort` 决定的字段降序，次排序始终按 `fetched_at` 降序。

### 数据显示 Fallback（`components/NewsCard.tsx`）

Twitter 条目两个字段缺失，已在卡片层 fallback：
- `title` 为空字符串 → `stripMarkdown(content).slice(0, 120)`
- `published_at` 为 null → `fetched_at`

### NewsCard 布局（时间线设计）

```
┌──────────┬──────────────────────────────┐
│ 时间列    │  卡片（Link 到 /news/hash）  │
│ HH:MM    │  徽章 + 信源名 · LIVE? | 分数│
│ X小时前  │  标题                        │
│ │ (rail) │  ai_summary_zh              │
│ ● (dot)  │  cluster_count 行           │
│          │  recommendation_reason       │
└──────────┴──────────────────────────────┘
```

`isLast` prop 控制 rail（竖线）是否延伸到底部。

### Markdown 清洗（`lib/format.ts`）

Jina.ai 抓取的 content 含原始 Markdown。`stripMarkdown()` 清洗：
- `![alt](url)` → 删除
- `[text](url)` → 保留 text
- 合并多余空白

### 类型

`lib/types.ts` 的 `NewsItem` 与 scraper 的 `COLUMNS`（`scraper/utils/supabase_db.py`）保持同步。新增 DB 字段时两处都要更新。

## 测试

- 框架：Vitest + React Testing Library，jsdom 环境
- 测试文件位置：`components/__tests__/` 和 `lib/__tests__/`
- 时间相关测试用 `vi.setSystemTime(NOW)` + `vi.useRealTimers()` 控制
- supabase.ts 测试：在文件顶部 `vi.mock('@supabase/supabase-js')`，通过 `__mockChain` 拿到 mock 对象

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL      # https://mielucmkbwbgywvwrmku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY # anon public key（非 service_role）
```

`.env.local` 已在 `.gitignore` 中排除（`.env*` 规则）。`.env.example` 有模板。
