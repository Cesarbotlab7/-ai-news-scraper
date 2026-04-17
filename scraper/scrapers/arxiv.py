"""arXiv最新论文抓取器（官方免费API）"""
import hashlib
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import requests
from config.settings import ARXIV_MAX_RESULTS, ARXIV_CATEGORIES

logger = logging.getLogger(__name__)

ARXIV_API = 'https://export.arxiv.org/api/query'
NS = {'atom': 'http://www.w3.org/2005/Atom'}


def scrape_category(category: str) -> list[dict]:
    logger.info(f'抓取 arXiv: {category}')
    params = {
        'search_query': f'cat:{category}',
        'sortBy': 'submittedDate',
        'sortOrder': 'descending',
        'max_results': ARXIV_MAX_RESULTS,
    }
    try:
        resp = requests.get(ARXIV_API, params=params, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        logger.warning(f'arXiv抓取失败 {category}: {e}')
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
    for cat in ARXIV_CATEGORIES:
        all_items.extend(scrape_category(cat))
    logger.info(f'arXiv抓取完成，共 {len(all_items)} 篇')
    return all_items


if __name__ == '__main__':
    import json
    logging.basicConfig(level=logging.INFO)
    items = scrape_category('cs.AI')
    print(json.dumps(items[:2], ensure_ascii=False, indent=2))
