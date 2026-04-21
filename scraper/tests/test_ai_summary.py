"""ai_summary.py 单元测试"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch
from utils.ai_summary import enrich_items


# ── enrich_items 过滤逻辑 ──────────────────────────────────────────────────

def test_twitter_english_gets_enriched():
    """Twitter 英文推文（无ai_summary_zh）应被处理"""
    items = [{
        'source_type': 'twitter',
        'language': 'en',
        'ai_summary_zh': '',
        'content': 'OpenAI just released GPT-5 with massive improvements.',
        'title': '',
    }]
    with patch('utils.ai_summary._call_api', return_value=('GPT-5发布', '重磅发布', ['模型发布', 'OpenAI'])):
        result = enrich_items(items)
    assert result[0]['ai_summary_zh'] == 'GPT-5发布'
    assert result[0]['recommendation_reason'] == '重磅发布'
    assert result[0]['tags'] == ['模型发布', 'OpenAI']


def test_hackernews_english_gets_enriched():
    """HN 英文条目（无ai_summary_zh）应被处理"""
    items = [{
        'source_type': 'hackernews',
        'language': 'en',
        'ai_summary_zh': '',
        'title': 'Show HN: Open source LLM router',
        'content': 'We built an open source router for LLMs.',
    }]
    with patch('utils.ai_summary._call_api', return_value=('开源LLM路由器', '开发者工具', ['开源', '开发者工具'])):
        result = enrich_items(items)
    assert result[0]['ai_summary_zh'] == '开源LLM路由器'
    assert result[0]['recommendation_reason'] == '开发者工具'
    assert result[0]['tags'] == ['开源', '开发者工具']


def test_arxiv_english_gets_enriched():
    """arXiv 英文条目（无ai_summary_zh）应被处理"""
    items = [{
        'source_type': 'arxiv',
        'language': 'en',
        'ai_summary_zh': '',
        'title': 'Scaling Laws for Neural Language Models',
        'content': 'We study empirical scaling laws for language model performance.',
    }]
    with patch('utils.ai_summary._call_api', return_value=('神经语言模型的扩展规律研究', '研究方法论突破', ['研究论文', '推理'])):
        result = enrich_items(items)
    assert result[0]['ai_summary_zh'] == '神经语言模型的扩展规律研究'
    assert result[0]['recommendation_reason'] == '研究方法论突破'
    assert result[0]['tags'] == ['研究论文', '推理']


def test_item_with_existing_summary_is_skipped():
    """已有 ai_summary_zh 的条目不应再次处理"""
    items = [{
        'source_type': 'twitter',
        'language': 'en',
        'ai_summary_zh': '已有摘要内容',
        'content': 'Some new content here.',
        'title': '',
    }]
    with patch('utils.ai_summary._call_api') as mock_api:
        result = enrich_items(items)
    mock_api.assert_not_called()
    assert result[0]['ai_summary_zh'] == '已有摘要内容'


def test_tags_written_back_to_item():
    """tags 字段应被写回 item"""
    items = [{
        'source_type': 'hackernews',
        'language': 'en',
        'ai_summary_zh': '',
        'title': 'New AI agent framework',
        'content': 'A new framework for building AI agents.',
    }]
    expected_tags = ['Agent', '开发者工具', '开源']
    with patch('utils.ai_summary._call_api', return_value=('新AI Agent框架发布', '开发者必备', expected_tags)):
        result = enrich_items(items)
    assert result[0]['tags'] == expected_tags


def test_rss_items_not_processed():
    """RSS 条目不在处理范围内，应被跳过"""
    items = [{
        'source_type': 'rss',
        'language': 'en',
        'ai_summary_zh': '',
        'title': 'Some RSS article',
        'content': 'Content here.',
    }]
    with patch('utils.ai_summary._call_api') as mock_api:
        result = enrich_items(items)
    mock_api.assert_not_called()
    assert 'tags' not in result[0]


def test_hn_and_arxiv_input_combines_title_and_content():
    """HN/arXiv 调用 _call_api 时传入的是 title + content 拼接"""
    items = [{
        'source_type': 'hackernews',
        'language': 'en',
        'ai_summary_zh': '',
        'title': 'My HN Title',
        'content': 'My HN content.',
    }]
    with patch('utils.ai_summary._call_api', return_value=('摘要', '理由', ['标签'])) as mock_api:
        enrich_items(items)
    called_with = mock_api.call_args[0][0]
    assert 'My HN Title' in called_with
    assert 'My HN content.' in called_with


def test_twitter_input_uses_content_only():
    """Twitter 调用 _call_api 时只传 content，不传 title"""
    items = [{
        'source_type': 'twitter',
        'language': 'en',
        'ai_summary_zh': '',
        'title': 'SHOULD NOT APPEAR',
        'content': 'Tweet body text here.',
    }]
    with patch('utils.ai_summary._call_api', return_value=('摘要', '理由', ['标签'])) as mock_api:
        enrich_items(items)
    called_with = mock_api.call_args[0][0]
    assert 'SHOULD NOT APPEAR' not in called_with
    assert 'Tweet body text here.' in called_with
