# AI热点资讯平台 — 产品规划文档

**最后更新：2026-04-17**
**战略调整：Web优先，小程序待个体工商户办理完成后上线**

---

## 产品定位

聚合AI领域最权威人物和媒体的最新动态，过滤噪音，提供干净的中文信息流。

**用户路径**：自用验证 → Web公开上线 → 小程序（个体工商户到位后）

---

## 整体架构

```
GitHub Actions（每3小时，公开仓库免费）
    ↓
Python 抓取层
    ├─ X账号（autocli google search + Jina.ai）
    ├─ RSS订阅（feedparser）
    ├─ HackerNews（官方免费API）
    └─ arXiv（官方免费API，cs.AI/cs.LG/cs.CL）
        ↓
Supabase（PostgreSQL，REST API）
        ↓
Next.js Web前端（Vercel部署）
        ↓（未来）
微信小程序前端（读同一个Supabase，wx.request）
```

---

## 数据源清单

**X账号（65个）**
- Tier 1人物：sama, karpathy, ylecun, DarioAmodei, demishassabis, drfeifei, AndrewYNg 等
- Tier 2机构：OpenAI, AnthropicAI, GoogleDeepMind, MetaAI, nvidia, deepseek_ai 等
- Tier 3从业者：swyx, mattturck, danshipper, rauchg 等

**RSS（16个）**
英文官方博客：OpenAI / Anthropic / Google DeepMind / Meta AI / NVIDIA / Microsoft Research
英文媒体：TechCrunch AI / MIT Technology Review / The Verge AI / VentureBeat AI
中文媒体：机器之心 / 量子位 / 36kr

**免费API**：HackerNews + arXiv（cs.AI + cs.LG + cs.CL）

---

## 重要性评分

```
importance_score = 时效分 + 来源分

时效分（满分60）：3h→60 / 6h→50 / 12h→40 / 24h→25 / 48h→10
来源分（满分40）：Tier1→40 / Tier2→30 / Tier3→20 / Tier4→10
```

---

## 事件聚合

多源报道同一事件时合并为一张卡片，展示"另有N个源报道"。

```
title+content → DashScope text-embedding-v3 向量
→ 余弦相似度 > 0.85 且时间差 < 48h → 同一 cluster_id
→ importance_score最高的条目 is_representative=true
→ 更新 cluster_count / cluster_sources
```

---

## Web页面结构

```
/              首页信息流（按importance_score排序，只取is_representative=true）
/source        信源分类（Tab：人物/机构/媒体/研究）
/item/[id]     内容详情（cluster_sources列表 + 跳转原文）
```

**信息流卡片：**
```
┌────────────────────────────────────────┐
│ Sam Altman · Tier1 · 2小时前      85分 │
│                                        │
│ GPT-5 will be released this quarter... │
│ [摘要] 奥特曼暗示GPT-5本季度发布...    │
│                                        │
│ 另有 9 个源也报道了此事件 →            │
│ 推荐理由：GPT-5发布将重塑开发者工作流  │
└────────────────────────────────────────┘
```

---

## 成本汇总

| 项目 | 费用/月 |
|------|---------|
| GitHub Actions（公开仓库） | 免费 |
| Supabase（免费档） | 免费 |
| DashScope AI摘要+向量 | < ¥2 |
| Vercel（免费档） | 免费 |
| Jina.ai（免费额度内） | 免费 |
| **合计** | **< ¥2/月** |

---

## 分阶段执行计划

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 抓取器MVP：RSS + HN + arXiv + X账号，GitHub Actions | ✅ 完成 |
| Phase 2 | 数据库切换Supabase：建表 + 修改scraper写入逻辑 + 验证数据入库 | ⬜ 当前 |
| Phase 3 | Next.js Web前端MVP：首页信息流 + 详情页，Vercel部署 | ⬜ |
| Phase 4 | 功能完善：信源Tab + 事件聚合展示 + 移动端适配 | ⬜ |
| Phase 5 | Web上线：自定义域名 + SEO基础优化 | ⬜ |
| Phase 6 | 小程序（待个体工商户办理完成）：WXML前端读Supabase，复用全部后端 | ⬜ 待定 |

---

## 关键技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 数据库 | Supabase（非微信云） | Web原生支持；小程序通过REST API同样可用；用户已熟悉 |
| 前端 | Next.js + Vercel | 用户已有PostureAI经验；SEO友好；无需审核 |
| 小程序时机 | 个体工商户到位后 | 资讯类目需企业主体，个人主体无法过审 |
| Twitter抓取 | autocli + Jina.ai | 零API费用，无需X付费接口 |
| AI摘要 | 仅英文推文 | 中文内容原文可读，不必要额外消耗token |
