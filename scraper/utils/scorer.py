"""重要性评分模块"""
from datetime import datetime, timezone
from config.settings import TIMELINESS_SCORES, TIER_SCORES

# Twitter 无 published_at 时的保守时效分（推文可能是 0-3 天前发布的，取中间值）
_TWITTER_NO_DATE_TIMELINESS = 20

# AI 相关关键词：命中其一则不惩罚
_AI_KEYWORDS = frozenset([
    'ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'deepmind',
    'neural', 'agent', 'chatgpt', 'machine learning', 'deep learning',
    'transformer', 'embedding', 'inference', 'fine-tun', 'benchmark',
    'multimodal', 'reasoning', 'artificial intelligence', 'language model',
    'foundation model', 'hugging face', 'mistral', 'llama', 'qwen', 'nvidia',
    '人工智能', '大模型', '语言模型', '机器学习', '神经网络', '智能',
])

# 明显与 AI 无关的内容降分幅度
_AI_RELEVANCE_PENALTY = -30


def score_item(item: dict) -> dict:
    score = _timeliness(item) + _tier_score(item) + _ai_relevance_penalty(item)
    item['importance_score'] = max(0, score)
    return item


def score_all(items: list[dict]) -> list[dict]:
    return [score_item(it) for it in items]


def _timeliness(item: dict) -> int:
    pub = item.get('published_at')
    if not pub:
        # 无发布时间（Twitter 等）：不用 fetched_at 顶时效分，给保守固定分
        return _TWITTER_NO_DATE_TIMELINESS
    try:
        if isinstance(pub, str):
            pub = datetime.fromisoformat(pub)
        if pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)
        hours = (datetime.now(timezone.utc) - pub).total_seconds() / 3600
        for threshold, score in sorted(TIMELINESS_SCORES.items()):
            if hours <= threshold:
                return score
        return 0
    except Exception:
        return 0


def _tier_score(item: dict) -> int:
    tier = item.get('source_tier', 4)
    return TIER_SCORES.get(tier, 0)


def _ai_relevance_penalty(item: dict) -> int:
    """内容不含任何 AI 关键词则扣分，过滤马斯克/其他大佬的非 AI 推文"""
    text = ' '.join([
        (item.get('title') or ''),
        (item.get('content') or ''),
    ]).lower()
    if any(kw in text for kw in _AI_KEYWORDS):
        return 0
    return _AI_RELEVANCE_PENALTY
