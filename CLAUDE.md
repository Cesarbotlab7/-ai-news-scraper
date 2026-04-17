# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

AI热点资讯平台：聚合AI领域权威人物和媒体的最新动态，每3小时自动抓取，存入Supabase，通过Next.js Web展示。

**战略：Web优先。小程序等个体工商户办理完成后再做，届时读同一个Supabase数据库，只需新写WXML前端。**

**两个子项目：**
- `scraper/` — Python抓取器，运行在GitHub Actions（公开仓库）
- `web/` — Next.js前端，部署在腾讯云上海服务器（Phase 3开始）

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
python scrapers/twitter.py                                  # 测试批量Jina搜索
```

## 数据管道（main.py 执行顺序）

```
scrapers/rss.py        → RSS订阅（feedparser）
scrapers/hackernews.py → HackerNews官方API（免费）
scrapers/arxiv.py      → arXiv API（免费）
scrapers/twitter.py    → s.jina.ai搜索 + r.jina.ai正文提取（无需X API，无需Chrome）
        ↓
utils/dedup.py         → url_hash去重，查询Supabase近48h已有内容
utils/scorer.py        → importance_score = 时效分(0-60) + 来源分(10-40)
utils/cluster.py       → DashScope text-embedding-v3 向量聚合，相似度>0.85归为同一事件
utils/ai_summary.py    → 仅对英文推文生成中文摘要+推荐理由（qwen-turbo）
utils/supabase_db.py   → 写入Supabase（REST API，非supabase-py SDK）
```

## 关键架构决策

**Twitter抓取**：`s.jina.ai` 搜索（HTTP请求，无需Chrome），查询格式 `(site:x.com/sama/status OR ...) after:YYYY-MM-DD`，再用 `r.jina.ai/{url}` 读取正文。正文解析找 `## Conversation` 段落，这是原始仓库的启发式逻辑，不要改动。`utils/wx_db.py` 保留但已废弃，不再使用。

**Supabase写入的两个陷阱**：
1. 批量POST时所有对象必须有完全相同的key（PostgREST限制）→ `supabase_db.py` 的 `COLUMNS` 集合和 `_normalize()` 做了归一化，新字段必须同步加入此集合
2. 批次内若有重复url_hash会触发409 → `insert_items()` 已在发送前对批次内去重

**事件聚合**：`cluster.py` 生成embedding → 余弦相似度矩阵 → 并查集合并。`DASHSCOPE_API_KEY` 未设置时静默跳过（不报错）。`is_representative=true` 的条目才在前端信息流展示。

**所有密钥通过环境变量注入**，`config/settings.py` 只用 `os.environ.get()`。

## GitHub Actions

- workflow文件在仓库根目录 `.github/workflows/scrape.yml`（不在`scraper/`下）
- 每3小时自动触发，支持手动 workflow_dispatch

| Secret | 用途 |
|--------|------|
| `SUPABASE_URL` | `https://mielucmkbwbgywvwrmku.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service Role Key（绕过RLS） |
| `DASHSCOPE_API_KEY` | 向量嵌入 + AI摘要（qwen-turbo） |
| `JINA_API_KEY` | s.jina.ai搜索 + r.jina.ai正文（必填，否则401）|

## accounts.txt 格式

```
handle,tier,display_name
sama,1,Sam Altman
OpenAI,2,OpenAI
```
Tier：1=顶级人物，2=顶级机构，3=从业者/媒体，4=社区（HN/arXiv）

## news_items 表核心字段

| 字段 | 说明 |
|------|------|
| `url_hash` | MD5(url)，唯一主键，去重依据 |
| `is_representative` | 前端只展示此字段为true的条目 |
| `cluster_id` | 同一事件的分组ID |
| `cluster_count` | 报道同一事件的源数量 |
| `ai_summary_zh` | 仅英文推文有值 |
| `recommendation_reason` | 一句话推荐理由 |
| `source_tier` | 1-4，影响importance_score |

## 开发阶段

- **Phase 1** ✅ 抓取器MVP（RSS + HN + arXiv + X账号，GitHub Actions）
- **Phase 2** ✅ 数据库Supabase：建表 + 写入验证 + 事件聚合 + AI摘要全流程跑通
- **Phase 3** ⬜ Next.js Web前端MVP：首页信息流 + 详情页（`web/`，部署腾讯云上海）
- **Phase 4** ⬜ 功能完善：信源Tab + 事件聚合展示 + 移动端适配
- **Phase 5** ⬜ Web上线：ICP备案（个人主体）+ 自定义域名 + SEO
- **Phase 6** ⬜ 微信小程序（待个体工商户办理）：WXML前端读Supabase，复用全部后端
