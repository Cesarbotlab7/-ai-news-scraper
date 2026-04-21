"""
事件聚合模块
原理：对标题+内容生成向量 → 余弦相似度 > 0.85 且时间差 < 48h → 归为同一事件簇
"""
import logging
import uuid
import math
from datetime import datetime, timezone, timedelta
import requests
from config.settings import (
    DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL, DASHSCOPE_EMBEDDING_MODEL,
    CLUSTER_SIMILARITY_THRESHOLD, CLUSTER_TIME_WINDOW_HOURS
)

logger = logging.getLogger(__name__)


def _get_embeddings(texts: list[str]) -> list[list[float]]:
    """批量获取文本向量（每次最多25条）"""
    if not DASHSCOPE_API_KEY:
        logger.warning('DASHSCOPE_API_KEY未设置，跳过事件聚合')
        return []

    url = f'{DASHSCOPE_BASE_URL}/embeddings'
    headers = {
        'Authorization': f'Bearer {DASHSCOPE_API_KEY}',
        'Content-Type': 'application/json',
    }
    all_embeddings = []
    batch_size = 25
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        payload = {'model': DASHSCOPE_EMBEDDING_MODEL, 'input': batch}
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            embeddings = [d['embedding'] for d in sorted(
                data['data'], key=lambda x: x['index']
            )]
            all_embeddings.extend(embeddings)
        except Exception as e:
            body = getattr(getattr(e, 'response', None), 'text', '')
            logger.warning(f'获取embedding失败: {e} | body: {body[:300]}')
            all_embeddings.extend([[] for _ in batch])

    return all_embeddings


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _parse_time(item: dict) -> datetime:
    pub = item.get('published_at') or item.get('fetched_at', '')
    try:
        dt = datetime.fromisoformat(pub) if isinstance(pub, str) else pub
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
    except Exception:
        return datetime.now(timezone.utc)


def cluster_items(items: list[dict]) -> list[dict]:
    """对items进行事件聚合，更新cluster相关字段后返回"""
    if len(items) < 2:
        return items

    texts = [f"{it.get('title', '')} {it.get('content', '')}".strip()[:300]
             for it in items]
    embeddings = _get_embeddings(texts)

    if not any(embeddings):
        logger.info('embedding为空，跳过聚合，所有条目设为独立代表')
        for item in items:
            item.setdefault('is_representative', True)
            item.setdefault('cluster_id', str(uuid.uuid4())[:8])
            item.setdefault('cluster_count', 1)
        return items

    n = len(items)
    cluster_map = list(range(n))   # 并查集

    def find(x):
        while cluster_map[x] != x:
            cluster_map[x] = cluster_map[cluster_map[x]]
            x = cluster_map[x]
        return x

    def union(x, y):
        cluster_map[find(x)] = find(y)

    time_window = timedelta(hours=CLUSTER_TIME_WINDOW_HOURS)

    for i in range(n):
        for j in range(i + 1, n):
            if not embeddings[i] or not embeddings[j]:
                continue
            time_diff = abs(_parse_time(items[i]) - _parse_time(items[j]))
            if time_diff > time_window:
                continue
            sim = _cosine_similarity(embeddings[i], embeddings[j])
            if sim >= CLUSTER_SIMILARITY_THRESHOLD:
                union(i, j)

    # 按cluster分组
    clusters: dict[int, list[int]] = {}
    for i in range(n):
        root = find(i)
        clusters.setdefault(root, []).append(i)

    # 为每个cluster分配ID，选出代表条目
    for indices in clusters.values():
        cluster_id = str(uuid.uuid4())[:8]
        all_sources = list({items[i]['source_display_name'] for i in indices})
        count = len(indices)
        # importance_score最高的作为代表
        rep_idx = max(indices, key=lambda i: items[i].get('importance_score', 0))
        for i in indices:
            items[i]['cluster_id'] = cluster_id
            items[i]['cluster_count'] = count
            items[i]['cluster_sources'] = all_sources
            items[i]['is_representative'] = (i == rep_idx)

    merged = sum(1 for v in clusters.values() if len(v) > 1)
    logger.info(f'事件聚合完成：{n} 条 → {len(clusters)} 个事件簇（{merged}个合并）')
    return items
