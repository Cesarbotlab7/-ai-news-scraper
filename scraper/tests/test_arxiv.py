"""arxiv.py 单元测试"""
import os
import sys
from unittest.mock import Mock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers import arxiv


class FakeResponse:
    def __init__(self, status_code: int, content: bytes = b''):
        self.status_code = status_code
        self.content = content

    def raise_for_status(self):
        if self.status_code >= 400:
            raise arxiv.requests.HTTPError(f'{self.status_code} error')


def test_request_category_retries_rate_limit_then_succeeds():
    """arXiv 429 后应重试，而不是直接放弃该分类"""
    params = {'search_query': 'cat:cs.AI'}
    responses = [
        FakeResponse(429),
        FakeResponse(200, b'<feed xmlns="http://www.w3.org/2005/Atom"></feed>'),
    ]

    with patch('scrapers.arxiv.requests.get', side_effect=responses) as mock_get:
        with patch('scrapers.arxiv.time.sleep') as mock_sleep:
            result = arxiv._request_category(params, 'cs.AI')

    assert result is responses[1]
    assert mock_get.call_count == 2
    mock_sleep.assert_called_once_with(5)


def test_request_category_sends_user_agent_header():
    """请求 arXiv 时应带 User-Agent，降低被限流概率"""
    params = {'search_query': 'cat:cs.AI'}

    with patch('scrapers.arxiv.requests.get', return_value=FakeResponse(200)) as mock_get:
        arxiv._request_category(params, 'cs.AI')

    headers = mock_get.call_args.kwargs['headers']
    assert headers['User-Agent'].startswith('AIHotNewsBot/')


def test_scrape_all_sleeps_between_categories():
    """多分类抓取之间应主动间隔，避免连续打爆 arXiv API"""
    with patch('scrapers.arxiv.ARXIV_CATEGORIES', ['cs.AI', 'cs.LG']):
        with patch('scrapers.arxiv.scrape_category', Mock(return_value=[])) as mock_scrape:
            with patch('scrapers.arxiv.time.sleep') as mock_sleep:
                arxiv.scrape_all()

    assert mock_scrape.call_count == 2
    mock_sleep.assert_called_once_with(3)
