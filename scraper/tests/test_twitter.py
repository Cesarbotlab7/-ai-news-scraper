"""twitter.py 单元测试"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers import twitter


def test_module_exposes_json_for_cli_output():
    """脚本入口使用 json.dumps，模块应显式导入 json"""
    assert twitter.json.dumps(['https://x.com/sama/status/1'])
