import os

# 抓取配置
TWITTER_DAYS_BACK = 3          # 抓取X账号过去N天的内容
TWITTER_BATCH_SIZE = 5         # 每批并发搜索数量
TWITTER_PER_SEARCH = 10        # 每次搜索返回条数
HN_TOP_N = 30                  # HackerNews取前N条热帖
ARXIV_MAX_RESULTS = 20         # arXiv每次最多取N篇
ARXIV_CATEGORIES = ['cs.AI', 'cs.LG', 'cs.CL']

# 聚合配置
CLUSTER_SIMILARITY_THRESHOLD = 0.85   # 余弦相似度阈值
CLUSTER_TIME_WINDOW_HOURS = 48        # 聚合时间窗口

# 重要性评分
TIMELINESS_SCORES = {3: 60, 6: 50, 12: 40, 24: 25, 48: 10}
TIER_SCORES = {1: 40, 2: 30, 3: 20, 4: 10}

# API端点
JINA_BASE_URL = 'https://r.jina.ai/'
DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
DASHSCOPE_SUMMARY_MODEL = 'qwen-turbo'
DASHSCOPE_EMBEDDING_MODEL = 'text-embedding-v3'

# 从环境变量读取密钥（GitHub Secrets注入）
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY', '')
JINA_API_KEY = os.environ.get('JINA_API_KEY', '')
