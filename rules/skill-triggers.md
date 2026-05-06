# Skill 触发规则（常驻层）

> 场景匹配时主动触发对应 skill，不等用户显式调用。每条有 ✅ 触发 / ❌ 不触发 区分。

## 内容创作类

| Skill | ✅ 触发 | ❌ 不触发 |
|---|---|---|
| **khazix-writer** | 写公众号文章 / 写稿 / 续写 / 扩写 / 长文输出 | 短内容（小红书/推特/朋友圈）/ 纯摘要 |
| **x-mastery-mentor** | X 运营 / 推特 / 怎么写推文 / 怎么涨粉 / X 算法 / tweet / thread | 不涉及 X/Twitter 平台 |

## 研究分析类

| Skill | ✅ 触发 | ❌ 不触发 |
|---|---|---|
| **hv-analysis** | 横纵分析 / 深度研究 / 研究一下 / 竞品分析 / 帮我摸清楚 / 这个产品是怎么回事 | 简单名词解释 / 公众号写作 |
| **optical-comm-analyst** | 光模块 / 光器件 / 光芯片 / 硅光 / CPO / 新易盛 / 中际旭创 / 天孚 / 800G / 1.6T / 光通信估值 | 不涉及光通信产业链 |

## 思维视角类

| Skill | ✅ 触发 | ❌ 不触发 |
|---|---|---|
| **steve-jobs-perspective** | 用乔布斯的视角 / 乔布斯会怎么看 / Jobs 模式 / 如果乔布斯怎么做 | 不涉及产品决策视角分析 |

## 工具 / 自动化类

| Skill | ✅ 触发 | ❌ 不触发 |
|---|---|---|
| **notebooklm** | 查 NotebookLM / 查笔记本 / 用 NLM 回答 | 一般问答，非笔记库查询 |
| **study** | NotebookLM 批量学习 / 带检查点的学习会话 | 单次问答 |
| **research-publisher** | 做 PPT / 出投研 PPT / 把研报做成 PPT / 投研汇报 | 不需要生成 .pptx 文件 |
| **neat-freak** | 同步文档 / 整理文档 / tidy up docs / sync up / 新人能直接上手 / 更新 README / 文档过期了 / /sync / /neat | 单次问答、写代码、不涉及文档同步 |

## AI 角色创建类

| Skill | ✅ 触发 | ❌ 不触发 |
|---|---|---|
| **huashu-nuwa** | 造 skill / 蒸馏 XX / 女娲 / 造人 / 做个 XX 视角 / 更新 XX skill / 我想提升决策质量 | 修改现有 skill 的内容细节 |

## 优先级说明

- 多个 skill 同时命中时，选最具体的（optical-comm-analyst > hv-analysis）
- 不确定时，先触发 hv-analysis（最通用的研究框架）
- 用户显式指定 skill 时直接执行，不做二次判断
