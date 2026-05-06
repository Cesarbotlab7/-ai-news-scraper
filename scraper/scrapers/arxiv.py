"""arXiv最新论文抓取器（官方免费API）"""
import hashlib
import logging
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import requests
from config.settings import ARXIV_MAX_RESULTS, ARXIV_CATEGORIES

logger = logging.getLogger(__name__)

ARXIV_API = 'https://export.arxiv.org/api/query'
NS = {'atom': 'http://www.w3.org/2005/Atom'}
HEADERS = {
    'User-Agent': 'AIHotNewsBot/1.0 (https://github.com/Cesarbotlab7/-ai-news-scraper)',
}


def _request_category(params: dict, category: str, retries: int = 3) -> requests.Response | None:
    """Call arXiv with conservative retries for rate limits and transient failures."""
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(ARXIV_API, params=params, headers=HEADERS, timeout=30)
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < retries:
                wait = 5 * attempt
                logger.warning(
                    f'arXiv暂时不可用 {category}: HTTP {resp.status_code}，'
                    f'{wait}s 后重试 ({attempt}/{retries})'
                )
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except requests.RequestException as e:
            if attempt >= retries:
                logger.warning(f'arXiv抓取失败 {category}: {e}')
                return None
            wait = 5 * attempt
            logger.warning(
                f'arXiv请求异常 {category}: {e}，{wait}s 后重试 '
                f'({attempt}/{retries})'
            )
            time.sleep(wait)
    return None


def scrape_category(category: str) -> list[dict]:
    logger.info(f'抓取 arXiv: {category}')
    params = {
        'search_query': f'cat:{category}',
        'sortBy': 'submittedDate',
        'sortOrder': 'descending',
        'max_results': ARXIV_MAX_RESULTS,
    }
    resp = _request_category(params, category)
    if resp is None:
        return []

    root = ET.fromstring(resp.content)
    items = []
    for entry in root.findall('atom:entry', NS):
        title_el = entry.find('atom:title', NS)
        summary_el = entry.find('atom:summary', NS)
        id_el = entry.find('atom:id', NS)
        published_el = entry.find('atom:published', NS)

        if title_el is None or id_el is None:
            continue

        title = title_el.text.strip().replace('\n', ' ')
        summary = summary_el.text.strip()[:600] if summary_el is not None else ''
        url = id_el.text.strip()
        published_str = published_el.text.strip() if published_el is not None else ''
        try:
            published_at = datetime.fromisoformat(published_str.replace('Z', '+00:00'))
        except Exception:
            published_at = datetime.now(timezone.utc)

        items.append({
            'source_type': 'arxiv',
            'source_handle': f'arXiv:{category}',
            'source_display_name': f'arXiv {category}',
            'source_tier': 4,
            'title': title,
            'content': summary,
            'url': url,
            'url_hash': hashlib.md5(url.encode()).hexdigest(),
            'language': 'en',
            'published_at': published_at.isoformat(),
            'fetched_at': datetime.now(timezone.utc).isoformat(),
            'importance_score': 0,
            'cluster_id': None,
            'is_representative': True,
            'cluster_count': 1,
            'cluster_sources': [f'arXiv {category}'],
            'ai_summary_zh': '',
            'recommendation_reason': '',
        })

    logger.info(f'  → 获取 {len(items)} 篇')
    return items


def scrape_all() -> list[dict]:
    all_items = []
    for i, cat in enumerate(ARXIV_CATEGORIES):
        if i > 0:
            time.sleep(3)
        all_items.extend(scrape_category(cat))
    logger.info(f'arXiv抓取完成，共 {len(all_items)} 篇')
    return all_items


if __name__ == '__main__':
    import json
    logging.basicConfig(level=logging.INFO)
    items = scrape_category('cs.AI')
    print(json.dumps(items[:2], ensure_ascii=False, indent=2))
