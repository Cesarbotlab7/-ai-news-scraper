# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

AI热点资讯平台：聚合AI领域权威人物和媒体的最新动态，每3小时自动抓取，存入Supabase，通过Next.js Web展示。

**战略：Web优先。小程序等个体工商户办理完成后再做，届时读同一个Supabase数据库，只需新写WXML前端。**

**两个子项目：**
- `scraper/` — Python抓取器，运行在GitHub Actions（公开仓库）
- `web/` — Next.js前端，部署在Vercel（Phase 3开始）

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
utils/dedup.py         → url_hash去重，查询Supabase近48h已有内容
utils/scorer.py        → importance_score = 时效分(0-60) + 来源分(10-40)
utils/cluster.py       → DashScope text-embedding-v3 向量聚合，相似度>0.85归为同一事件
utils/ai_summary.py    → 仅对英文推文生成中文摘要+推荐理由（qwen-turbo）
utils/supabase_db.py   → 写入Supabase（supabase-py）
```

## 关键架构决策

**数据库选Supabase（非微信云）**：Web端原生支持；小程序通过REST API同样可用；用户已熟悉（PostureAI同款）。微信云数据库已废弃，`utils/wx_db.py` 保留但不再使用。

**Twitter抓取无API费用**：`autocli google search` 批量查询（10账号/次），格式为 `(site:x.com/sama/status OR site:x.com/karpathy/status) after:YYYY-MM-DD`，再用 `r.jina.ai/{tweet_url}` 读取正文。Jina解析找 `## Conversation` 段落提取正文，这是原始仓库的启发式逻辑，不要改动。

**事件聚合**：`cluster.py` 对每条内容生成embedding → 余弦相似度矩阵 → 并查集合并。`DASHSCOPE_API_KEY` 未设置时静默跳过聚合（不报错），`is_representative=true` 的条目才在前端信息流展示。

**所有密钥通过环境变量注入**，`config/settings.py` 只用 `os.environ.get()`，本地测试时在shell里 `export` 或创建 `.env` 文件（已在 `.gitignore` 排除）。

## GitHub Actions Secrets

| Secret | 用途 |
|--------|------|
| `SUPABASE_URL` | Supabase项目URL |
| `SUPABASE_SERVICE_KEY` | Service Role Key（绕过RLS，后端写入用） |
| `DASHSCOPE_API_KEY` | 向量嵌入 + AI摘要 |
| `JINA_API_KEY` | 推文正文抓取（可选） |

## accounts.txt 格式

```
handle,tier,display_name
sama,1,Sam Altman
OpenAI,2,OpenAI
```
Tier含义：1=顶级人物，2=顶级机构，3=从业者/媒体，4=社区（HN/arXiv）

## news_items 表字段

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

- **Phase 1** ✅ 抓取器MVP（RSS + HN + arXiv + X账号，GitHub Actions）
- **Phase 2** ⬜ 数据库切换Supabase：建表 + 修改scraper写入 + 验证数据入库（当前）
- **Phase 3** ⬜ Next.js Web前端MVP：首页信息流 + 详情页，Vercel部署（`web/`）
- **Phase 4** ⬜ 功能完善：信源Tab + 事件聚合展示 + 移动端适配
- **Phase 5** ⬜ Web上线：自定义域名 + SEO基础优化
- **Phase 6** ⬜ 微信小程序（待个体工商户办理）：WXML前端读Supabase，复用全部后端
