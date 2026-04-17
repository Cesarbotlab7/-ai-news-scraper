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


def insert_items(items: list[dict]) -> int:
    """批量写入news_items，url_hash冲突时忽略（on conflict do nothing）"""
    if not _ok() or not items:
        return 0
    url = f'{SUPABASE_URL}/rest/v1/news_items'
    headers = {**_headers(), 'Prefer': 'resolution=ignore-duplicates,return=minimal'}
    try:
        resp = requests.post(url, json=items, headers=headers, timeout=30)
        if resp.status_code in (200, 201):
            logger.info(f'写入Supabase：{len(items)} 条（重复自动跳过）')
            return len(items)
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
