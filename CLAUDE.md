# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

AI热点资讯平台：聚合AI领域权威人物和媒体的最新动态，每3小时自动抓取，存入微信云数据库，通过微信小程序展示。

**两个子项目：**
- `scraper/` — Python抓取器，运行在GitHub Actions（公开仓库）
- `miniprogram/` — 微信小程序（待开发，Phase 3）

## 常用命令

所有命令在 `scraper/` 目录下执行：

```bash
# 安装依赖
pip install -r requirements.txt

# 本地测试完整流程（不写数据库）
python main.py --dry-run

# 单独测试某个scraper
python scrapers/rss.py
python scrapers/hackernews.py
python scrapers/arxiv.py
python scrapers/twitter.py https://x.com/sama/status/123  # 测试单条推文解析
python scrapers/twitter.py                                  # 测试批量搜索（需要autocli）

# 外部依赖：autocli（Google搜索，需要单独安装）
curl -fsSL https://raw.githubusercontent.com/nashsu/autocli/main/scripts/install.sh | sh
```

## 数据管道（main.py 执行顺序）

```
scrapers/rss.py        → RSS订阅（feedparser）
scrapers/hackernews.py → HackerNews官方API（免费）
scrapers/arxiv.py      → arXiv API（免费）
scrapers/twitter.py    → autocli google search + r.jina.ai（无需X API）
        ↓
utils/dedup.py         → url_hash去重，查询云数据库近48h已有内容
utils/scorer.py        → importance_score = 时效分(0-60) + 来源分(10-40)
utils/cluster.py       → DashScope text-embedding-v3 向量聚合，相似度>0.85归为同一事件
utils/ai_summary.py    → 仅对英文推文生成中文摘要+推荐理由（qwen-turbo）
utils/wx_db.py         → 写入微信云数据库 HTTP API
```

## 关键架构决策

**Twitter抓取无API费用**：`autocli google search` 批量查询（10账号/次），格式为 `(site:x.com/sama/status OR site:x.com/karpathy/status) after:YYYY-MM-DD`，再用 `r.jina.ai/{tweet_url}` 读取正文。Jina解析找 `## Conversation` 段落提取正文，这是原始仓库的启发式逻辑，不要改动。

**事件聚合**：`cluster.py` 对每条内容生成embedding → 余弦相似度矩阵 → 并查集合并。`DASHSCOPE_API_KEY` 未设置时静默跳过聚合（不报错），`is_representative=true` 的条目才在前端信息流展示。

**所有密钥通过环境变量注入**，`config/settings.py` 只用 `os.environ.get()`，本地测试时在shell里 `export` 或创建 `.env` 文件（已在 `.gitignore` 排除）。

## accounts.txt 格式

```
handle,tier,display_name
sama,1,Sam Altman
OpenAI,2,OpenAI
```
Tier含义：1=顶级人物，2=顶级机构，3=从业者/媒体，4=社区（HN/arXiv）

## news_items 字段

| 核心字段 | 说明 |
|---------|------|
| `url_hash` | MD5(url)，去重主键 |
| `source_tier` | 1-4，影响importance_score |
| `is_representative` | 前端只查此字段为true的条目 |
| `cluster_id` | 同一事件的分组ID |
| `cluster_count` | 报道同一事件的源数量（展示"另有N个源报道"）|
| `ai_summary_zh` | 仅英文推文有值 |
| `recommendation_reason` | 一句话推荐理由 |

## 开发阶段

- **Phase 1** ✅ 抓取器MVP（当前）
- **Phase 2** ⬜ 测试数据入库，验证事件聚合效果
- **Phase 3** ⬜ 微信小程序（`miniprogram/`，复用AI体态检测小程序的云开发技术栈）
- **Phase 4** ⬜ 小程序云函数：`getNewsFeed`（分页+筛选）、`getDetail`
- **Phase 5** ⬜ 上线准备
