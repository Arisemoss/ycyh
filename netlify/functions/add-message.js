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
    .replace(/[@#$%^&*()_+=\-\[\]{};':"\\|,.<>\/?]/g, '')
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g');
  
  // 检查每个敏感词
  for (const word of SENSITIVE_WORDS) {
    const lowerWord = word.toLowerCase();
    if (normalizedText.includes(lowerWord)) {
      hasSensitive = true;
      break;
    }
  }
  
  return { clean: text, hasSensitive };
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { nickname, content, anonymous } = JSON.parse(event.body);

    // 验证内容
    if (!content || content.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '祝福内容不能为空' }),
      };
    }

    // 敏感词过滤
    const nicknameFilter = filterSensitiveWords(nickname || '');
    const contentFilter = filterSensitiveWords(content);

    if (nicknameFilter.hasSensitive || contentFilter.hasSensitive) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '祝福中包含不当词汇，请修改' }),
      };
    }

    // 处理匿名
    let finalNickname = nickname || '神秘好友';
    if (anonymous || !nickname || nickname.trim().length === 0) {
      finalNickname = '匿名';
    }

    // 保存到 FaunaDB
    const newMessage = await client.query(
      q.Create(q.Collection('messages'), {
        data: {
          nickname: finalNickname,
          content: content.trim(),
          anonymous: !!anonymous,
          time: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: newMessage.ref.id,
        nickname: finalNickname,
        content: content.trim(),
        time: newMessage.data.time,
        anonymous: !!anonymous,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add message' }),
    };
  }
};
