"""重要性评分模块"""
from datetime import datetime, timezone
from config.settings import TIMELINESS_SCORES, TIER_SCORES


def score_item(item: dict) -> dict:
    item['importance_score'] = _timeliness(item) + _tier_score(item)
    return item


def score_all(items: list[dict]) -> list[dict]:
    return [score_item(it) for it in items]


def _timeliness(item: dict) -> int:
    pub = item.get('published_at') or item.get('fetched_at')
    if not pub:
        return 0
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
