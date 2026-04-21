"""Supabase数据库封装"""
import logging
import requests
from config.settings import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)


def _headers() -> dict:
    return {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }


def _ok() -> bool:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.warning('SUPABASE_URL或SUPABASE_SERVICE_KEY未设置，跳过数据库操作')
        return False
    return True


COLUMNS = {
    'url_hash', 'source_type', 'source_handle', 'source_display_name',
    'source_tier', 'title', 'content', 'url', 'language', 'published_at',
    'fetched_at', 'importance_score', 'cluster_id', 'is_representative',
    'cluster_count', 'cluster_sources', 'ai_summary_zh', 'recommendation_reason',
}


def _normalize(items: list[dict]) -> list[dict]:
    """统一key集合，过滤掉表中不存在的字段"""
    return [{k: item.get(k) for k in COLUMNS} for item in items]


def insert_items(items: list[dict]) -> int:
    """批量写入news_items，批次内去重 + 与已有数据冲突时跳过"""
    if not _ok() or not items:
        return 0

    # 批次内按url_hash去重
    seen: set[str] = set()
    unique = []
    for item in _normalize(items):
        h = item.get('url_hash', '')
        if h and h not in seen:
            seen.add(h)
            unique.append(item)

    endpoint = f'{SUPABASE_URL}/rest/v1/news_items?on_conflict=url_hash'
    headers = {**_headers(), 'Prefer': 'resolution=ignore-duplicates,return=minimal'}
    try:
        resp = requests.post(endpoint, json=unique, headers=headers, timeout=30)
        if resp.status_code in (200, 201):
            logger.info(f'写入Supabase：{len(unique)} 条（重复自动跳过）')
            return len(unique)
        logger.warning(f'写入失败 {resp.status_code}: {resp.text[:200]}')
        return 0
    except Exception as e:
        logger.warning(f'写入异常: {e}')
        return 0


def query_recent_hashes(hours: int = 48) -> set[str]:
    """查询近N小时已有的url_hash，用于去重"""
    if not _ok():
        return set()
    from datetime import datetime, timezone, timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    url = f'{SUPABASE_URL}/rest/v1/news_items'
    headers = {**_headers(), 'Prefer': ''}
    params = {
        'select': 'url_hash',
        'fetched_at': f'gte.{cutoff}',
        'limit': 5000,
    }
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=15)
        if resp.status_code == 200:
            return {r['url_hash'] for r in resp.json()}
        logger.warning(f'查询失败 {resp.status_code}: {resp.text[:200]}')
        return set()
    except Exception as e:
        logger.warning(f'查询异常: {e}')
        return set()
