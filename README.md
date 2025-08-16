# 邮箱登录系统

一个基于邮箱验证码的安全登录系统，支持用户通过邮箱接收验证码进行登录认证。

## 功能特性

- 📧 邮箱验证码登录
- 🔐 JWT令牌认证
- ⏱️ 验证码有效期管理（5分钟）
- 🚫 频率限制（60秒内只能发送一次）
- 💾 SQLite数据库存储
- 📱 响应式设计
- 🎨 现代化UI界面

## 技术栈

**后端:**
- Node.js + Express
- SQLite数据库
- Nodemailer邮件服务
- JWT身份验证
- bcrypt密码加密

**前端:**
- 原生HTML/CSS/JavaScript
- 现代化响应式设计
- 动画效果和交互体验

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env` 并配置：

```env
# 邮件服务配置（以Gmail为例）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT密钥
JWT_SECRET=your-very-secure-secret-key-here

# 服务器配置
PORT=5000

# 数据库配置
DB_PATH=./database/app.db
```

### 3. 邮箱配置说明

**Gmail配置：**
1. 开启两步验证
2. 生成应用专用密码
3. 使用应用专用密码作为 `EMAIL_PASS`

**其他邮箱服务商：**
- QQ邮箱：smtp.qq.com:587
- 163邮箱：smtp.163.com:465
- Outlook：smtp-mail.outlook.com:587

### 4. 启动应用

**开发环境：**
```bash
npm run dev
```

**生产环境：**
```bash
npm start
```

访问 `http://localhost:5000` 查看应用。

## 项目结构

```
├── client/                 # 前端文件
│   ├── index.html         # 主页面
│   ├── styles.css         # 样式文件
│   └── script.js          # 前端逻辑
├── server/                # 后端文件
│   ├── index.js           # 服务器入口
│   ├── routes/
│   │   └── auth.js        # 认证路由
│   ├── models/
│   │   └── database.js    # 数据库模型
│   └── services/
│       └── emailService.js # 邮件服务
├── database/              # 数据库文件（自动生成）
├── package.json           # 项目配置
├── .env.example           # 环境变量示例
└── README.md              # 说明文档
```

## API接口

### 1. 请求验证码
```http
POST /api/auth/request-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**响应：**
```json
{
  "success": true,
  "message": "验证码已发送到您的邮箱，请查收"
}
```

### 2. 验证登录
```http
POST /api/auth/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### 3. 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer jwt_token_here
```

**响应：**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T12:00:00Z"
  }
}
```

## 安全特性

1. **验证码安全：**
   - 6位随机数字验证码
   - 5分钟有效期
   - 一次性使用，验证后立即失效
   - 发送频率限制（60秒内只能发送一次）

2. **JWT认证：**
   - 7天有效期
   - 安全的密钥签名
   - 前端自动存储和使用

3. **数据库安全：**
   - 过期验证码自动清理
   - 用户信息加密存储

## 使用流程

1. **输入邮箱** → 用户输入邮箱地址
2. **发送验证码** → 系统发送6位数字验证码到邮箱
3. **输入验证码** → 用户输入收到的验证码
4. **验证成功** → 系统生成JWT令牌，用户登录成功
5. **欢迎页面** → 显示欢迎信息，可以继续使用系统

## 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查邮箱配置是否正确
   - 确认邮箱服务商的SMTP设置
   - 检查防火墙和网络连接

2. **验证码过期**
   - 验证码有效期为5分钟
   - 可点击"重新发送验证码"获取新验证码

3. **数据库错误**
   - 确保有写入权限
   - 检查数据库文件路径

### 日志查看

启动应用后，控制台会显示详细的日志信息，包括：
- 数据库连接状态
- 邮件发送结果
- API请求记录
- 错误信息

## 开发说明

### 扩展功能

可以根据需要添加以下功能：

1. **用户管理**
   - 用户资料管理
   - 登录历史记录
   - 账户安全设置

2. **安全增强**
   - 登录失败次数限制
   - IP黑名单
   - 设备指纹识别

3. **功能优化**
   - 邮箱模板自定义
   - 多语言支持
   - 管理后台

### 部署建议

1. **生产环境配置**
   - 使用环境变量管理敏感信息
   - 配置HTTPS
   - 使用进程管理器（如PM2）

2. **数据库优化**
   - 定期清理过期数据
   - 数据库备份策略
   - 考虑使用PostgreSQL或MySQL

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来帮助改进这个项目。