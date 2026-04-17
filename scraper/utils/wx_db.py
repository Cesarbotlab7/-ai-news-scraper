"""
微信云数据库HTTP API封装
文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/database/
"""
import logging
import requests
from config.settings import WX_ENV_ID, WX_APPID, WX_APPSECRET

logger = logging.getLogger(__name__)

BASE_URL = 'https://api.weixin.qq.com/tcb'

_cached_token: str = ''


def _get_access_token() -> str:
    global _cached_token
    if _cached_token:
        return _cached_token
    if not WX_APPID or not WX_APPSECRET:
        return ''
    resp = requests.get(
        'https://api.weixin.qq.com/cgi-bin/token',
        params={'grant_type': 'client_credential', 'appid': WX_APPID, 'secret': WX_APPSECRET},
        timeout=10
    )
    data = resp.json()
    if 'access_token' not in data:
        logger.error(f'获取access_token失败: {data}')
        return ''
    _cached_token = data['access_token']
    return _cached_token


def _headers() -> dict:
    return {'Content-Type': 'application/json'}


def _url(endpoint: str) -> str:
    return f'{BASE_URL}/{endpoint}?access_token={_get_access_token()}'


def insert_items(items: list[dict]) -> int:
    """批量写入news_items，返回成功写入数量"""
    if not WX_APPID or not WX_APPSECRET or not WX_ENV_ID:
        logger.warning('WX_APPID/WX_APPSECRET/WX_ENV_ID未设置，跳过写入')
        return 0

    success = 0
    for item in items:
        try:
            payload = {
                'env': WX_ENV_ID,
                'query': f'db.collection("news_items").add({{data: {_to_json(item)}}})'
            }
            resp = requests.post(_url('databaseadd'), json=payload,
                                  headers=_headers(), timeout=15)
            data = resp.json()
            if data.get('errcode', -1) == 0:
                success += 1
            else:
                logger.warning(f'写入失败: {data.get("errmsg")}')
        except Exception as e:
            logger.warning(f'写入异常: {e}')

    logger.info(f'写入云数据库：{success}/{len(items)} 条成功')
    return success


def query_collection(collection: str, where: dict, field: str, limit: int = 1000) -> list[dict]:
    """简单查询，返回指定字段列表"""
    if not WX_APPID or not WX_APPSECRET or not WX_ENV_ID:
        return []
    import json
    where_str = json.dumps(where, ensure_ascii=False)
    payload = {
        'env': WX_ENV_ID,
        'query': f'db.collection("{collection}").where({where_str}).field({{"{field}":true}}).limit({limit}).get()'
    }
    try:
        resp = requests.post(_url('databasequery'), json=payload,
                              headers=_headers(), timeout=15)
        data = resp.json()
        import json as _json
        raw = data.get('data', [])
        # TCB databasequery返回的data是JSON字符串列表，需要逐条解析
        return [_json.loads(r) if isinstance(r, str) else r for r in raw]
    except Exception as e:
        logger.warning(f'查询失败: {e}')
        return []


def _to_json(item: dict) -> str:
    import json
    return json.dumps(item, ensure_ascii=False)
