# AI热点资讯平台 — 产品规划文档

## 产品定位

**目标**：聚合AI领域最权威的人物和媒体的最新动态，过滤噪音，提供干净的中文信息流。
**用户路径**：A（自用）→ C（公开小程序+付费订阅，需注册个体工商户开通微信支付）

---

## 整体架构

```
GitHub Actions（每3小时 cron，公开仓库免费无限额）
    ↓
Python 抓取层
    ├─ X账号（autocli google search + Jina.ai，无需X API）
    ├─ RSS订阅（feedparser）
    ├─ HackerNews（官方免费API）
    ├─ arXiv（官方免费API，cs.AI/cs.LG/cs.CL）
    └─ 中文媒体RSS（机器之心/量子位/36kr）
        ↓
微信云数据库（HTTP API写入）
        ↓
微信云函数（getNewsFeed / getDetail）
        ↓
微信小程序前端
```

---

## 数据源清单

**X账号（65个）**
- Tier 1人物：sama, karpathy, ylecun, geoffreyhinton, DarioAmodei, demishassabis, drfeifei, AndrewYNg 等
- Tier 2机构：OpenAI, AnthropicAI, GoogleDeepMind, MetaAI, nvidia, deepseek_ai, Alibaba_Qwen 等
- Tier 3从业者：swyx, mattturck, danshipper, rauchg 等

**RSS（16个）**

英文官方博客：OpenAI / Anthropic / Google DeepMind / Meta AI / NVIDIA / Google AI / Microsoft Research

英文媒体：TechCrunch AI / MIT Technology Review / The Verge AI / Ars Technica / VentureBeat AI

中文媒体：机器之心 / 量子位 / 36kr

**免费API**：HackerNews + arXiv（cs.AI + cs.LG + cs.CL）

---

## 重要性评分算法

```
importance_score = 时效分 + 来源分

时效分（满分60）：
  3小时内 → 60，6小时内 → 50，12小时内 → 40
  24小时内 → 25，48小时内 → 10，超过48小时 → 0

来源分（满分40）：
  Tier 1（顶级人物）→ 40
  Tier 2（顶级机构）→ 30
  Tier 3（权威媒体/从业者）→ 20
  Tier 4（HackerNews/arXiv）→ 10
```

---

## 事件聚合设计

多个源报道同一事件时，合并为一张卡片展示"另有N个源也报道了此事件"。

```
实现流程：
1. 对 title + content 拼接后调用 DashScope text-embedding-v3 生成向量
2. 计算余弦相似度矩阵（并查集合并）
3. 相似度 > 0.85 且时间差 < 48h → 归为同一 cluster_id
4. importance_score 最高的条目设 is_representative=true（前端展示主条目）
5. 更新所有条目的 cluster_count 和 cluster_sources
```

---

## AI处理策略

- **中文摘要**：仅对英文推文生成，模型 `qwen-turbo`
- **推荐理由**：与摘要同一次API调用，prompt要求同时输出一句话推荐理由
- **向量生成**：`text-embedding-v3`，每条约100 token
- **月成本估算**：< ¥2/月

---

## 小程序页面结构

```
pages/
├── index/    首页信息流（按importance_score排序，只取is_representative=true）
├── source/   信源分类浏览（Tab：人物/机构/媒体/研究）
├── detail/   内容详情（展示cluster_sources列表 + 跳转原文）
└── profile/  设置（Phase 5，预留用户系统入口）
```

**信息流卡片设计：**
```
┌────────────────────────────────────────┐
│ [头像] Sam Altman · Tier1 · 2小时前    │  85
│                                        │
│ GPT-5 will be released this quarter... │
│ [摘要] 奥特曼暗示GPT-5本季度发布...    │
│                                        │
│ [Agent] [OpenAI] [模型发布]            │
│ 另有 9 个源也报道了此事件 →            │
│                                        │
│ 推荐理由：GPT-5发布将重塑开发者工作流  │
│                              🔖 →      │
└────────────────────────────────────────┘
```

---

## 成本汇总

| 项目 | 费用/月 |
|------|---------|
| GitHub Actions（公开仓库） | 免费 |
| 微信云开发（免费档） | 免费 |
| DashScope AI摘要+向量 | < ¥2 |
| Jina.ai（免费额度内） | 免费 |
| **合计** | **< ¥2/月** |

---

## 分阶段执行计划

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 抓取器MVP：RSS + HN + arXiv + X账号，GitHub Actions跑通 | ✅ 代码完成 |
| Phase 2 | 推GitHub，手动触发验证数据入库，确认事件聚合效果 | ⬜ |
| Phase 3 | 微信小程序骨架：首页信息流 + 详情页 | ⬜ |
| Phase 4 | AI摘要 + 推荐理由 + 评分显示 + 信源Tab | ⬜ |
| Phase 5 | 收藏 + 用户偏好设置 | ⬜ |
| Phase 6 | 性能优化 + 提审上线 | ⬜ |

---

## 竞品参考

参考平台：**AI HOT**（Web端）

我们的差异化：
- 微信小程序（移动端原生体验）
- 事件聚合（同一事件多源合并，显示关注度）
- 推荐理由（AI生成，解释为什么值得看）
- 专注中文用户，权威源精选（非广撒网）
