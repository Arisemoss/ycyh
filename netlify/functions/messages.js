const faunadb = require('faunadb');

// 初始化 FaunaDB 客户端
const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});

// 敏感词列表（中英文混合）
const SENSITIVE_WORDS = [
  // 脏话类
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'cunt', 'dick', 'pussy',
  '傻逼', '草泥马', '操你妈', '日你妈', '狗日的', '傻逼', '操蛋', '去死', '滚蛋', '混蛋',
  // 歧视类
  'nigger', 'chink', 'retard', 'faggot', 'spic',
  '傻逼', '脑残', '弱智', '白痴', '废物',
  // 广告类
  '赚钱', '兼职', '加微信', '加qq', '加好友', '扫码', '二维码', '推广', '广告',
  'sex', 'porn', '色情', '赌博', '博彩', '毒品', '枪支'
];

// 敏感词过滤函数
function filterSensitiveWords(text) {
  if (!text) return { clean: '', hasSensitive: false };
  
  let cleanText = text;
  let hasSensitive = false;
  
  // 预处理：转小写，移除空格和常见符号
  const normalizedText = text.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[@#$%^&*()_+=\-\[\]{};':"\\|,.<>\/?]/g, '');
  
  // 检查每个敏感词
  for (const word of SENSITIVE_WORDS) {
    const lowerWord = word.toLowerCase();
    if (normalizedText.includes(lowerWord)) {
      hasSensitive = true;
      // 替换敏感词为 ***
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleanText = cleanText.replace(regex, '***');
    }
  }
  
  return { clean: cleanText, hasSensitive };
}

exports.handler = async function(event, context) {
  // 允许跨域
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 从 FaunaDB 获取所有消息，按时间倒序排列
    const response = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Index('messages_by_time_desc')),
          { size: 100 }
        ),
        q.Lambda('X', q.Get(q.Var('X')))
      )
    );

    // 格式化数据
    const messages = response.data.map(item => ({
      id: item.ref.id,
      nickname: item.data.nickname,
      content: item.data.content,
      time: item.data.time,
      anonymous: item.data.anonymous,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(messages),
    };
  } catch (error) {
    console.error('Error:', error);
    
    // 如果是索引不存在的错误，尝试使用简单查询
    if (error.message && error.message.includes('index')) {
      try {
        const response = await client.query(
          q.Map(
            q.Paginate(q.Documents(q.Collection('messages'))),
            q.Lambda('X', q.Get(q.Var('X')))
          )
        );

        const messages = response.data.map(item => ({
          id: item.ref.id,
          nickname: item.data.nickname,
          content: item.data.content,
          time: item.data.time,
          anonymous: item.data.anonymous,
        })).sort((a, b) => new Date(b.time) - new Date(a.time));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(messages),
        };
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch messages' }),
    };
  }
};
