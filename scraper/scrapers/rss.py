"""RSS订阅抓取器"""
import hashlib
import logging
from datetime import datetime, timezone, timedelta
import feedparser
import requests
from config.settings import TWITTER_DAYS_BACK

logger = logging.getLogger(__name__)

CUTOFF_DAYS = TWITTER_DAYS_BACK


def _parse_feeds_file(feeds_file: str) -> list[tuple]:
    feeds = []
    with open(feeds_file, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split(',')
            if len(parts) >= 4:
                feeds.append((parts[0].strip(), parts[1].strip(),
                               int(parts[2].strip()), parts[3].strip()))
    return feeds


def _entry_to_item(entry, source_name: str, tier: int, language: str) -> dict | None:
    url = entry.get('link', '')
    if not url:
        return None

    # 解析发布时间
    published_at = None
    if hasattr(entry, 'published_parsed') and entry.published_parsed:
        published_at = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
        published_at = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)

    # 过滤超过N天的内容
    if published_at:
        cutoff = datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)
        if published_at < cutoff:
            return None

    title = entry.get('title', '').strip()
    summary = entry.get('summary', '') or entry.get('description', '')
    # 去除HTML标签
    import re
    summary = re.sub(r'<[^>]+>', '', summary).strip()
    content = summary[:800] if summary else title

    return {
        'source_type': 'rss',
        'source_handle': source_name,
        'source_display_name': source_name,
        'source_tier': tier,
        'title': title,
        'content': content,
        'url': url,
        'url_hash': hashlib.md5(url.encode()).hexdigest(),
        'language': language,
        'published_at': published_at.isoformat() if published_at else None,
        'fetched_at': datetime.now(timezone.utc).isoformat(),
        'importance_score': 0,
        'cluster_id': None,
        'is_representative': True,
        'cluster_count': 1,
        'cluster_sources': [source_name],
        'ai_summary_zh': '',
        'recommendation_reason': '',
    }


def scrape_feed(url: str, source_name: str, tier: int, language: str) -> list[dict]:
    logger.info(f'抓取 RSS: {source_name}')
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; AINewsBot/1.0)'}
        resp = requests.get(url, headers=headers, timeout=15)
        feed = feedparser.parse(resp.content)
    except Exception as e:
        logger.warning(f'  → RSS抓取失败 {source_name}: {e}')
        return []

    items = []
    for entry in feed.entries:
        item = _entry_to_item(entry, source_name, tier, language)
        if item:
            items.append(item)

    logger.info(f'  → 获取 {len(items)} 条')
    return items


def scrape_all(feeds_file: str) -> list[dict]:
    feeds = _parse_feeds_file(feeds_file)
    all_items = []
    for url, name, tier, language in feeds:
        items = scrape_feed(url, name, tier, language)
        all_items.extend(items)
    logger.info(f'RSS抓取完成，共 {len(all_items)} 条')
    return all_items


if __name__ == '__main__':
    import json
    logging.basicConfig(level=logging.INFO)
    items = scrape_feed(
        'https://openai.com/blog/rss.xml', 'OpenAI Blog', 2, 'en'
    )
    print(json.dumps(items[:2], ensure_ascii=False, indent=2))
