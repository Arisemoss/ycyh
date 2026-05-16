# 🎂 生日祝福墙

一个温馨的生日祝福墙应用，可以部署在 Netlify 上，支持匿名发送祝福、趣味心灵鸡汤、敏感词过滤等功能。

## ✨ 功能特性

- 🔗 通过 URL 参数 `?name=xxx` 设置寿星名字
- 💝 任何人都可以发送祝福，无需登录
- 🎭 支持匿名发送功能
- 🌟 随机显示趣味心灵鸡汤（30条中英文混合）
- 📝 前后端双重敏感词过滤（30+常见敏感词）
- 💾 祝福持久化存储（使用 FaunaDB）
- 🎨 精美的生日主题 UI 设计
- 🎊 彩带动画和气球动画效果
- 📱 完美适配移动端，支持微信/QQ 内置浏览器
- 🔄 一键刷新查看下一条祝福
- 📊 显示祝福总数

## 🚀 部署步骤

### 1. 创建 FaunaDB 数据库

1. 访问 [FaunaDB](https://fauna.com/) 并注册/登录账号
2. 点击 "Create Database" 创建一个新数据库
3. 在数据库中，点击 "Create Collection" 创建集合，命名为 `messages`
4. 在数据库中，点击 "Create Index" 创建索引：
   - Index Name: `messages_by_time_desc`
   - Source Collection: `messages`
   - Terms: 留空
   - Values: 添加 `time`，选择 "Reverse"（倒序）
   - 点击 "Save" 保存

5. 点击侧边栏 "Security" → "New Key" 创建访问密钥
   - Role: 选择 "Server"
   - 点击 "Save"
   - 复制生成的密钥（只显示一次，请妥善保存）

### 2. 部署到 Netlify

1. 将此代码推送到 GitHub 仓库
2. 访问 [Netlify](https://app.netlify.com/) 并注册/登录账号
3. 点击 "New site from Git" → 选择 GitHub
4. 选择刚才的仓库
5. 在部署设置页面：
   - Build command: 留空或填 `echo 'No build needed'`
   - Publish directory: `.`
   - 点击 "Show advanced" → "New variable"
   - 添加环境变量：
     - Key: `FAUNADB_SECRET`
     - Value: 刚才复制的 FaunaDB 密钥
6. 点击 "Deploy site" 开始部署

### 3. 开始使用

- 部署完成后，访问 Netlify 分配的网址
- 通过 `?name=寿星名字` 参数设置寿星名称，例如：
  `https://your-site.netlify.app/?name=小明`
- 分享这个链接给朋友们，让他们一起送上祝福！

## 📁 项目结构

```
/workspace
├── index.html                  # 前端页面（包含所有 HTML/CSS/JS）
├── netlify.toml               # Netlify 配置文件
├── package.json               # 项目依赖
├── README.md                  # 项目说明文档
└── netlify/
    └── functions/
        ├── messages.js        # 获取祝福列表的 Serverless 函数
        └── add-message.js     # 添加祝福的 Serverless 函数
```

## 🛠 本地开发

如需本地调试：

1. 安装 Netlify CLI: `npm install -g netlify-cli`
2. 安装依赖: `npm install`
3. 在项目根目录创建 `.env` 文件，填入：
   ```
   FAUNADB_SECRET=你的fauna密钥
   ```
4. 运行本地开发服务器: `netlify dev`
5. 访问 http://localhost:8888

## 🎯 核心功能说明

### 匿名机制
- 用户可以选择是否匿名发送
- 开启匿名后，保存的昵称为 "匿名"
- 发送者显示为 "🎭 匿名"

### 敏感词过滤
- 前后端双重过滤
- 支持常见符号和数字替换绕过（如 @→a, 0→o）
- 包含 30+ 常见中英文敏感词
- 发现敏感词时会提示用户修改

### 心灵鸡汤
- 预置 30 条中英文混合的趣味心灵鸡汤
- 每次切换祝福卡片时随机显示
- 发送祝福成功后也会显示一条随机鸡汤

### 分享优化
- 配置了 Open Graph 标签
- 微信/QQ 分享时会显示正确的标题和描述
- 响应式设计适配各种屏幕尺寸

## 📝 技术栈

- 前端: 原生 HTML/CSS/JavaScript（无框架依赖）
- 后端: Netlify Functions (Node.js)
- 数据库: FaunaDB (Serverless)
- 部署: Netlify

## 🎨 自定义

### 修改心灵鸡汤
编辑 `index.html` 中的 `SOUP_LIST` 数组即可。

### 修改敏感词
编辑 `index.html`（前端）和 `netlify/functions/` 下的两个函数文件（后端）中的 `SENSITIVE_WORDS` 数组。

### 修改样式
编辑 `index.html` 中的 `<style>` 标签内的样式。

## 📄 License

MIT License