"""AI中文摘要 + 推荐理由生成模块（仅处理英文推文）"""
import logging
import requests
from config.settings import DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL, DASHSCOPE_SUMMARY_MODEL

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个AI资讯编辑助手。用户会给你一条英文推文或文章内容。
请输出严格的JSON格式（不要markdown代码块），包含两个字段：
- summary_zh：50字以内的中文摘要，说清楚核心信息
- reason：20字以内的推荐理由，说明为什么值得关注

示例输出：
{"summary_zh": "OpenAI发布GPT-5，编程能力提升40%，推理能力大幅改进", "reason": "年度最重磅模型发布，开发者必看"}"""


def _call_api(content: str) -> tuple[str, str]:
    """调用DashScope，返回(summary_zh, reason)"""
    if not DASHSCOPE_API_KEY:
        return '', ''

    url = f'{DASHSCOPE_BASE_URL}/chat/completions'
    headers = {
        'Authorization': f'Bearer {DASHSCOPE_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': DASHSCOPE_SUMMARY_MODEL,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': content[:500]},
        ],
        'temperature': 0,
        'max_tokens': 200,
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
        text = resp.json()['choices'][0]['message']['content'].strip()
        import json, re
        text = re.sub(r'^```json\s*|\s*```$', '', text).strip()
        data = json.loads(text)
        return data.get('summary_zh', ''), data.get('reason', '')
    except Exception as e:
        logger.warning(f'AI摘要失败: {e}')
        return '', ''


def enrich_items(items: list[dict]) -> list[dict]:
    """只对英文推文生成摘要，其他内容跳过"""
    targets = [it for it in items
               if it.get('language') == 'en'
               and it.get('source_type') == 'twitter'
               and not it.get('ai_summary_zh')]

    logger.info(f'生成AI摘要：{len(targets)} 条英文推文')
    for item in targets:
        summary, reason = _call_api(item.get('content', ''))
        item['ai_summary_zh'] = summary
        item['recommendation_reason'] = reason

    return items
