"""去重模块：基于url_hash过滤已入库的内容"""
import logging
from utils.wx_db import query_collection

logger = logging.getLogger(__name__)


def filter_new_items(items: list[dict]) -> list[dict]:
    """过滤掉已存在于数据库中的条目"""
    if not items:
        return []

    # 批量查询已有的url_hash
    existing_hashes = _get_existing_hashes()
    new_items = [it for it in items if it['url_hash'] not in existing_hashes]

    logger.info(f'去重：{len(items)} 条 → {len(new_items)} 条新内容')
    return new_items


def _get_existing_hashes() -> set[str]:
    """从数据库拉取近48小时所有url_hash"""
    from datetime import datetime, timezone, timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    try:
        results = query_collection(
            collection='news_items',
            where={'fetched_at': {'$gt': cutoff}},
            field='url_hash',
            limit=5000
        )
        return {r['url_hash'] for r in results if 'url_hash' in r}
    except Exception as e:
        logger.warning(f'获取已有hash失败，跳过去重: {e}')
        return set()
