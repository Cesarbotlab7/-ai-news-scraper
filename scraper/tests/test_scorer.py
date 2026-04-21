"""scorer.py 单元测试"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
from utils.scorer import score_item

def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def _hours_ago_iso(h: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=h)).isoformat()


# ── 时效分 ────────────────────────────────────────────────────────────────

def test_timeliness_fresh_ai_content():
    """1小时内的AI内容拿满时效分"""
    item = {
        'source_tier': 2,
        'published_at': _hours_ago_iso(1),
        'fetched_at': _now_iso(),
        'title': 'OpenAI releases new GPT model',
        'content': 'OpenAI just released a new LLM with improved reasoning.',
    }
    result = score_item(item)
    assert result['importance_score'] == 90  # 60(timeliness) + 30(tier2)


def test_timeliness_24h_old():
    """24小时前的内容拿低时效分"""
    item = {
        'source_tier': 2,
        'published_at': _hours_ago_iso(24),
        'fetched_at': _now_iso(),
        'title': 'Anthropic releases Claude update',
        'content': 'New AI model released with improved capabilities.',
    }
    result = score_item(item)
    assert result['importance_score'] == 55  # 25(timeliness for <=24h) + 30(tier2)


def test_timeliness_over_48h_zero():
    """超过48小时的内容时效分为0"""
    item = {
        'source_tier': 1,
        'published_at': _hours_ago_iso(60),
        'fetched_at': _now_iso(),
        'title': 'Old AI news',
        'content': 'This happened 60 hours ago about some LLM.',
    }
    result = score_item(item)
    assert result['importance_score'] == 40  # 0(timeliness) + 40(tier1)


# ── Twitter 无 published_at 的修复 ────────────────────────────────────────

def test_twitter_no_published_at_gets_conservative_timeliness():
    """Twitter 无 published_at 时，不能因 fetched_at≈now 而拿满时效分"""
    item = {
        'source_tier': 1,
        'published_at': None,
        'fetched_at': _now_iso(),  # 刚抓取，但推文实际可能是3天前发的
        'title': 'New GPT-5 announced by OpenAI CEO',
        'content': 'Sam Altman announces major AI breakthrough.',
        'source_type': 'twitter',
    }
    result = score_item(item)
    # 不得超过 tier分(40) + 保守时效分(20) = 60
    # 绝对不能是 100（满时效60 + tier40）
    assert result['importance_score'] <= 60
    assert result['importance_score'] > 0  # 有AI内容，不为0


def test_elon_musk_non_ai_tweet_penalized():
    """Elon Musk 发非AI推文，不应拿高分"""
    item = {
        'source_tier': 1,
        'published_at': None,
        'fetched_at': _now_iso(),
        'title': 'Elon Musk @elonmusk Support Marty, he\'s a cool dude',
        'content': 'Support Marty, he\'s a cool dude. I truly honored to have the support of President Donald J. Trump.',
        'source_type': 'twitter',
    }
    result = score_item(item)
    # 非AI内容应该被降分，最终得分不超过50
    assert result['importance_score'] < 50


# ── AI 相关性 ──────────────────────────────────────────────────────────────

def test_ai_content_no_penalty():
    """含AI关键词的内容不受惩罚"""
    item = {
        'source_tier': 3,
        'published_at': _hours_ago_iso(2),
        'fetched_at': _now_iso(),
        'title': 'Claude 3.7 achieves new benchmark',
        'content': 'Anthropic releases Claude 3.7, an LLM with improved reasoning capabilities.',
    }
    result = score_item(item)
    assert result['importance_score'] == 80  # 60(timeliness <=3h) + 20(tier3) + 0(AI content)


def test_non_ai_content_penalized():
    """非AI内容被降分"""
    item = {
        'source_tier': 1,
        'published_at': _hours_ago_iso(2),
        'fetched_at': _now_iso(),
        'title': 'Support Marty for Congress',
        'content': 'Support Marty, he is a cool dude running for Nevada 3rd Congressional District.',
    }
    result = score_item(item)
    # 原始分 = 60 + 40 = 100，降分后应该 ≤ 70（60+40-30）
    assert result['importance_score'] <= 70


def test_score_never_negative():
    """最终分数不为负"""
    item = {
        'source_tier': 4,
        'published_at': _hours_ago_iso(100),
        'fetched_at': _now_iso(),
        'title': 'Some random non-AI post',
        'content': 'This has nothing to do with technology or AI at all.',
    }
    result = score_item(item)
    assert result['importance_score'] >= 0
