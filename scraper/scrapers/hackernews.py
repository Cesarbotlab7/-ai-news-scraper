"""HackerNews热门帖子抓取器（官方免费API）"""
import hashlib
import logging
from datetime import datetime, timezone
import requests
from config.settings import HN_TOP_N

logger = logging.getLogger(__name__)

HN_API = 'https://hacker-news.firebaseio.com/v0'
AI_KEYWORDS = [
    'ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic',
    'machine learning', 'deep learning', 'neural', 'transformer',
    'diffusion', 'stable diffusion', 'midjourney', 'model', 'agent',
    'rag', 'embedding', 'fine-tun', 'inference', 'gpu', 'nvidia',
    '大模型', '人工智能', '语言模型'
]


def _is_ai_related(title: str) -> bool:
    title_lower = title.lower()
    return any(kw in title_lower for kw in AI_KEYWORDS)


def _fetch_item(item_id: int) -> dict | None:
    try:
        resp = requests.get(f'{HN_API}/item/{item_id}.json', timeout=10)
        return resp.json()
    except Exception:
        return None


def scrape_top() -> list[dict]:
    logger.info('抓取 HackerNews 热门')
    try:
        resp = requests.get(f'{HN_API}/topstories.json', timeout=15)
        top_ids = resp.json()[:200]   # 取前200再筛选
    except Exception as e:
        logger.warning(f'HN获取失败: {e}')
        return []

    items = []
    for item_id in top_ids:
        if len(items) >= HN_TOP_N:
            break
        raw = _fetch_item(item_id)
        if not raw or raw.get('type') != 'story':
            continue
        title = raw.get('title', '')
        if not _is_ai_related(title):
            continue

        url = raw.get('url', f'https://news.ycombinator.com/item?id={item_id}')
        published_at = datetime.fromtimestamp(raw.get('time', 0), tz=timezone.utc)

        items.append({
            'source_type': 'hackernews',
            'source_handle': 'HackerNews',
            'source_display_name': 'Hacker News',
            'source_tier': 4,
            'title': title,
            'content': title,
            'url': url,
            'url_hash': hashlib.md5(url.encode()).hexdigest(),
            'language': 'en',
            'published_at': published_at.isoformat(),
            'fetched_at': datetime.now(timezone.utc).isoformat(),
            'importance_score': 0,
            'cluster_id': None,
            'is_representative': True,
            'cluster_count': 1,
            'cluster_sources': ['Hacker News'],
            'ai_summary_zh': '',
            'recommendation_reason': '',
            'hn_score': raw.get('score', 0),
        })

    logger.info(f'  → 筛出 {len(items)} 条AI相关')
    return items


if __name__ == '__main__':
    import json
    logging.basicConfig(level=logging.INFO)
    items = scrape_top()
    print(json.dumps(items[:3], ensure_ascii=False, indent=2))
