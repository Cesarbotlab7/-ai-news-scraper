"""
X账号抓取器
技术栈：参照 github.com/koffuxu/ai-influence-digest/scripts/scan_x_weekly.py
原理：autocli google search（批量查询）→ r.jina.ai（推文正文提取）
绝对禁止使用X API付费接口
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import logging
import re
import subprocess
import time
from typing import Any

import requests

from config.settings import TWITTER_DAYS_BACK, TWITTER_PER_SEARCH, JINA_API_KEY

logger = logging.getLogger(__name__)

STATUS_RE = re.compile(r'^https?://x\.com/([^/]+)/status/(\d+)')


# ── 工具函数 ──────────────────────────────────────────────────────────────

def _chunk(lst: list, size: int) -> list[list]:
    return [lst[i:i + size] for i in range(0, len(lst), size)]


def _days_ago_str(days: int) -> str:
    return (dt.date.today() - dt.timedelta(days=days)).isoformat()


def _normalize_url(url: str) -> str | None:
    m = STATUS_RE.match(url or '')
    if not m:
        return None
    return f'https://x.com/{m.group(1)}/status/{m.group(2)}'


# ── Google搜索（autocli）────────────────────────────────────────────────

def _autocli_search(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """调用 autocli google search，返回结果列表"""
    cmd = ['autocli', 'google', 'search', '-f', 'json', '--limit', str(limit), query]
    try:
        out = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=30)
        data = json.loads(out)
        return data if isinstance(data, list) else []
    except subprocess.CalledProcessError as e:
        logger.warning(f'autocli搜索失败: {e.output[:200]}')
        return []
    except Exception as e:
        logger.warning(f'autocli异常: {e}')
        return []


def _search_batch(handles: list[str], days: int, per_search: int) -> list[str]:
    """
    将多个账号批量合并为一条Google查询，返回推文URL列表。
    查询格式：(site:x.com/sama/status OR site:x.com/karpathy/status ...) after:YYYY-MM-DD
    """
    after = _days_ago_str(days)
    sites = ' OR '.join(f'site:x.com/{h}/status' for h in handles)
    query = f'({sites}) after:{after}'

    results = _autocli_search(query, limit=per_search)

    urls = []
    for r in results:
        url = _normalize_url(str(r.get('url', '')))
        if url:
            urls.append(url)
    return urls


# ── Jina.ai 推文正文提取 ──────────────────────────────────────────────────

def _fetch_tweet_text(status_url: str, timeout: int = 30) -> str:
    """
    用 r.jina.ai 获取推文正文。
    解析逻辑直接移植自原始仓库：找 ## Conversation 段落后提取正文。
    """
    headers = {}
    if JINA_API_KEY:
        headers['Authorization'] = f'Bearer {JINA_API_KEY}'

    try:
        resp = requests.get(f'https://r.jina.ai/{status_url}',
                            headers=headers, timeout=timeout)
        resp.raise_for_status()
        text = resp.text
    except Exception as e:
        logger.warning(f'Jina抓取失败 {status_url}: {e}')
        return ''

    # 找 Conversation 段落起点
    idx = text.find('## Conversation')
    if idx == -1:
        idx = text.find('# Conversation')
    body = text[idx:] if idx != -1 else text

    lines = [ln.strip() for ln in body.splitlines()]
    out_lines: list[str] = []
    started = False

    for ln in lines:
        if ln in ('## Conversation', '# Conversation'):
            started = True
            continue
        if not started:
            continue
        if (ln.startswith('Quote') or ln.startswith('## New to X')
                or ln.startswith('Sign up')):
            break
        if ln.startswith('[') and 'Views' in ln:
            break
        if not ln:
            if out_lines and out_lines[-1] != '':
                out_lines.append('')
            continue
        if ln.lower() in ('post', 'conversation', 'see new posts'):
            continue
        out_lines.append(ln)

    cleaned = '\n'.join(out_lines).strip()
    return cleaned if len(cleaned) >= 40 else cleaned


# ── 构建标准item ─────────────────────────────────────────────────────────

def _build_item(handle: str, tier: int, display_name: str,
                url: str, text: str) -> dict:
    return {
        'source_type': 'twitter',
        'source_handle': handle,
        'source_display_name': display_name,
        'source_tier': tier,
        'title': '',
        'content': text[:1000],
        'url': url,
        'url_hash': hashlib.md5(url.encode()).hexdigest(),
        'language': 'en',
        'published_at': None,
        'fetched_at': dt.datetime.now(dt.timezone.utc).isoformat(),
        'importance_score': 0,
        'cluster_id': None,
        'is_representative': True,
        'cluster_count': 1,
        'cluster_sources': [display_name],
        'ai_summary_zh': '',
        'recommendation_reason': '',
    }


# ── 公开接口 ─────────────────────────────────────────────────────────────

def scrape_all(accounts_file: str, batch_size: int = 10) -> list[dict]:
    """
    读取 accounts.txt（handle,tier,display_name 格式），
    按 batch_size 分批搜索，返回 news_items 列表。
    """
    accounts: list[tuple[str, int, str]] = []
    with open(accounts_file, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split(',')
            if len(parts) >= 3:
                accounts.append((parts[0].strip(),
                                  int(parts[1].strip()),
                                  parts[2].strip()))

    # handle → (tier, display_name) 映射，用于URL归属
    meta = {h: (tier, name) for h, tier, name in accounts}
    handles = [h for h, _, _ in accounts]

    # 批量搜索，收集所有推文URL（去重）
    seen_urls: set[str] = set()
    all_urls: list[tuple[str, str]] = []   # (url, handle)

    for batch in _chunk(handles, batch_size):
        urls = _search_batch(batch, TWITTER_DAYS_BACK, TWITTER_PER_SEARCH)
        for url in urls:
            m = STATUS_RE.match(url)
            handle_in_url = m.group(1).lower() if m else ''
            # 只保留属于本批账号的URL
            matched_handle = next(
                (h for h in batch if h.lower() == handle_in_url), None
            )
            if matched_handle and url not in seen_urls:
                seen_urls.add(url)
                all_urls.append((url, matched_handle))
        time.sleep(2)   # 批次间间隔

    logger.info(f'搜索到 {len(all_urls)} 条推文URL，开始获取正文...')

    items = []
    for url, handle in all_urls:
        tier, display_name = meta.get(handle, (3, handle))
        text = _fetch_tweet_text(url)
        if not text:
            continue
        items.append(_build_item(handle, tier, display_name, url, text))
        time.sleep(1)   # Jina限流保护

    logger.info(f'X账号抓取完成，共 {len(items)} 条')
    return items


if __name__ == '__main__':
    import sys
    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) >= 2:
        # 测试单条推文：python twitter.py https://x.com/sama/status/123
        url = sys.argv[1]
        text = _fetch_tweet_text(url)
        print(text)
    else:
        # 测试单批搜索
        urls = _search_batch(['sama', 'karpathy'], days=3, per_search=5)
        print(json.dumps(urls, ensure_ascii=False, indent=2))
