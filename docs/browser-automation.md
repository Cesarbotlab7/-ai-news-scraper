# 浏览器自动化 / NotebookLM / 代理

## 通用规则

运行浏览器自动化或 NotebookLM 查询时：
- **每个问题必须新建一个对话**（chat/conversation），禁止复用已有会话，否则会返回缓存结果

## 代理 / VPN 相关

- 本机代理端口：1082
- 设置：`HTTP_PROXY=http://127.0.0.1:1082` / `HTTPS_PROXY=http://127.0.0.1:1082`
- `NO_PROXY=localhost,127.0.0.1,::1`

使用代理/VPN 时，启动自动化前须：
1. 检查 Chrome profile 锁定文件是否存在
2. 确认代理协议（SOCKS5 还是 HTTP）
3. 验证目标域名已通过 VPN 路由
