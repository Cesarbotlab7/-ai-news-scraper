"""去重模块：基于url_hash过滤已入库的内容"""
import logging
from utils.supabase_db import query_recent_hashes

logger = logging.getLogger(__name__)


def filter_new_items(items: list[dict]) -> list[dict]:
    """过滤掉已存在于数据库中的条目"""
    if not items:
        return []

    existing_hashes = query_recent_hashes(hours=48)
    new_items = [it for it in items if it['url_hash'] not in existing_hashes]

    logger.info(f'去重：{len(items)} 条 → {len(new_items)} 条新内容')
    return new_items
