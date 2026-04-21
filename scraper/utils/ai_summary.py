"""AI中文摘要 + 推荐理由 + tags 生成模块（处理 twitter/hackernews/arxiv 英文内容）"""
import logging
import requests
from config.settings import DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL, DASHSCOPE_SUMMARY_MODEL

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个AI资讯编辑助手。用户会给你一条英文推文或文章内容。
输出严格JSON（不要markdown代码块），包含三个字段：
- summary_zh：50字以内中文摘要，说清核心信息
- reason：20字以内推荐理由
- tags：3-6个中文短标签（每个2-6字），从以下推荐词表中选，也可适当扩展：
  类型：模型发布/开源/研究论文/产品发布/融资/大佬观点/行业动态
  能力：Agent/编码/推理/多模态/视频生成/图像生成/语音/RAG
  主体：Anthropic/OpenAI/谷歌/Meta/英伟达/Mistral/阿里
  议题：安全/对齐/成本/算力/开发者工具

示例：{"summary_zh":"OpenAI发布GPT-5...", "reason":"年度最重磅发布", "tags":["模型发布","OpenAI","编码"]}"""


def _call_api(content: str) -> tuple[str, str, list]:
    """调用DashScope，返回(summary_zh, reason, tags)"""
    if not DASHSCOPE_API_KEY:
        return '', '', []

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
        'max_tokens': 300,
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
        text = resp.json()['choices'][0]['message']['content'].strip()
        import json, re
        text = re.sub(r'^```json\s*|\s*```$', '', text).strip()
        data = json.loads(text)
        raw_tags = data.get('tags', [])
        tags = raw_tags if isinstance(raw_tags, list) else []
        return data.get('summary_zh', ''), data.get('reason', ''), tags
    except Exception as e:
        logger.warning(f'AI摘要失败: {e}')
        return '', '', []


def enrich_items(items: list[dict]) -> list[dict]:
    """对 twitter/hackernews/arxiv 的英文内容生成摘要，已有摘要的跳过"""
    targets = [it for it in items
               if it.get('source_type') in {'twitter', 'hackernews', 'arxiv'}
               and it.get('language') == 'en'
               and not it.get('ai_summary_zh')]

    twitter_count = sum(1 for it in targets if it.get('source_type') == 'twitter')
    hn_count = sum(1 for it in targets if it.get('source_type') == 'hackernews')
    arxiv_count = sum(1 for it in targets if it.get('source_type') == 'arxiv')
    logger.info(f'生成AI摘要：Twitter {twitter_count}条 / HN {hn_count}条 / arXiv {arxiv_count}条')

    for item in targets:
        source_type = item.get('source_type')
        if source_type == 'twitter':
            # Twitter 只用 content（title 通常为空或与 content 重复）
            input_text = item.get('content', '')[:500]
        else:
            # HN / arXiv 拼接 title + content
            input_text = (item.get('title', '') + ' ' + item.get('content', ''))[:500]

        summary, reason, tags = _call_api(input_text)
        item['ai_summary_zh'] = summary
        item['recommendation_reason'] = reason
        item['tags'] = tags

    return items
