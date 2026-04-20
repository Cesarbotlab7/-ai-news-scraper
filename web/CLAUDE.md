# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 版本警告

此项目使用 **Next.js 16**，与训练数据中的 Next.js 14 有破坏性变更。修改任何路由或数据获取代码前，先读 `node_modules/next/dist/docs/` 中的对应文档。

最关键的变更：
- **动态路由 `params` 是 Promise**：必须 `await params` 才能解构，不能直接解构
  ```tsx
  // ✅ 正确
  const { url_hash } = await params
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

### 数据流

```
Supabase (news_items 表)
  ↓ anon key + RLS（SELECT 对 anon 全开）
lib/supabase.ts          → getFeedItems / getItemByHash / getClusterSiblings
  ↓
app/page.tsx             → 首页信息流（30条，ISR 15分钟）
app/news/[url_hash]/page.tsx → 详情页（动态，ISR 15分钟）
  ↓
components/NewsCard.tsx  → 卡片（用 displayTitle + displayTime fallback）
components/SourceBadge   → tier → 颜色标签
components/TimeAgo       → iso → "X小时前"
```

### 数据层关键细节（`lib/supabase.ts`）

- 用 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `getFeedItems` 查 `is_representative=true`，按 `importance_score desc, published_at desc` 排序
- `getClusterSiblings` 当 `clusterId` 为 null 时直接返回 `[]`，不查库

### 数据显示 Fallback（`components/NewsCard.tsx`）

Twitter 条目的两个字段缺失，已在卡片层做 fallback：
- `title` 为空字符串 → 用 `stripMarkdown(content).slice(0, 120)`
- `published_at` 为 null → 用 `fetched_at`

### Markdown 清洗（`lib/format.ts`）

Jina.ai 抓取的 content 含原始 Markdown（链接、图片语法）。`stripMarkdown()` 在卡片显示前清洗：
- `![alt](url)` → 删除
- `[text](url)` → 保留 text
- 合并多余空白

### 类型

`lib/types.ts` 的 `NewsItem` 字段与 scraper 的 `COLUMNS`（`scraper/utils/supabase_db.py:25`）保持同步。新增 DB 字段时两处都要更新。

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
