"""
AI热点资讯平台 — 抓取入口
执行顺序：抓取 → 去重 → 评分 → 聚合 → AI摘要 → 写库
"""
import logging
import argparse
import json
import os
import sys

# 确保config目录可被import
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('main')

CONFIG_DIR = os.path.join(os.path.dirname(__file__), 'config')
ACCOUNTS_FILE = os.path.join(CONFIG_DIR, 'accounts.txt')
RSS_FEEDS_FILE = os.path.join(CONFIG_DIR, 'rss_feeds.txt')


def run(dry_run: bool = False):
    logger.info('===== AI热点资讯抓取开始 =====')

    # 1. 抓取所有数据源
    all_items = []

    from scrapers.rss import scrape_all as rss_scrape
    rss_items = rss_scrape(RSS_FEEDS_FILE)
    all_items.extend(rss_items)

    from scrapers.hackernews import scrape_top
    hn_items = scrape_top()
    all_items.extend(hn_items)

    from scrapers.arxiv import scrape_all as arxiv_scrape
    arxiv_items = arxiv_scrape()
    all_items.extend(arxiv_items)

    # X账号抓取（最后执行，有延迟）
    from scrapers.twitter import scrape_all as twitter_scrape
    twitter_items = twitter_scrape(ACCOUNTS_FILE)
    all_items.extend(twitter_items)

    logger.info(f'抓取总计：{len(all_items)} 条')

    # 2. 去重
    from utils.dedup import filter_new_items
    new_items = filter_new_items(all_items)
    if not new_items:
        logger.info('无新内容，退出')
        return

    # 3. 评分
    from utils.scorer import score_all
    new_items = score_all(new_items)

    # 4. 事件聚合
    from utils.cluster import cluster_items
    new_items = cluster_items(new_items)

    # 5. AI摘要 + 推荐理由
    from utils.ai_summary import enrich_items
    new_items = enrich_items(new_items)

    logger.info(f'处理完成，准备写入 {len(new_items)} 条')

    if dry_run:
        logger.info('[DRY RUN] 不写入数据库，输出前5条样例：')
        print(json.dumps(new_items[:5], ensure_ascii=False, indent=2))
        return

    # 6. 写入数据库
    from utils.supabase_db import insert_items
    inserted = insert_items(new_items)
    logger.info(f'===== 完成，写入 {inserted} 条 =====')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true',
                        help='不写入数据库，仅打印结果')
    args = parser.parse_args()
    run(dry_run=args.dry_run)
