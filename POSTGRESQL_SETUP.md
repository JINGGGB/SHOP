# PostgreSQL 安装与迁移指南

## 1. 安装PostgreSQL

### Windows系统
1. 下载PostgreSQL安装程序：https://www.postgresql.org/download/windows/
2. 运行安装程序，按照向导进行安装
3. 记住设置的超级用户（postgres）密码
4. 默认端口为5432

### 安装验证
```bash
psql --version
```

## 2. 创建数据库和用户

打开命令行，使用postgres用户登录：
```bash
psql -U postgres
```

执行以下SQL命令：
```sql
-- 创建数据库
CREATE DATABASE tea_shop;

-- 创建用户
CREATE USER tea_shop_user WITH PASSWORD 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE tea_shop TO tea_shop_user;

-- 退出
\q
```

## 3. 初始化数据库架构

在项目根目录执行：
```bash
psql -U tea_shop_user -d tea_shop -f database/postgres_schema.sql
```

## 4. 配置环境变量

编辑项目根目录的 `.env` 文件：

```env
# 注释掉SQLite配置
# DB_TYPE=sqlite
# DB_PATH=./database/app.db

# 启用PostgreSQL配置
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tea_shop
DB_USER=tea_shop_user
DB_PASSWORD=your_secure_password  # 使用您设置的密码
```

## 5. 安装必要的npm包

```bash
npm install pg
```

## 6. 执行数据迁移

### 备份现有数据（重要！）
```bash
copy server\database\app.db server\database\app.db.backup
```

### 运行迁移脚本
```bash
node migrate-to-postgres.js
```

迁移脚本会自动：
- 连接到SQLite数据库读取现有数据
- 连接到PostgreSQL数据库
- 迁移所有表数据（用户、产品、订单、分类、验证码）
- 保留所有热门产品和折扣信息
- 更新数据库序列

## 7. 切换到PostgreSQL

### 方法1：修改database.js文件
编辑 `server/models/database.js`，将其替换为 `database-postgres.js` 的内容。

### 方法2：重命名文件
```bash
# 备份原SQLite版本
move server\models\database.js server\models\database-sqlite.js

# 使用PostgreSQL版本
move server\models\database-postgres.js server\models\database.js
```

## 8. 重启服务器

```bash
npm start
```

## 9. 验证迁移

1. 访问网站：http://localhost:5000
2. 检查功能：
   - 用户登录/注册
   - 产品列表显示
   - 购物车功能
   - 订单创建
   - 管理员功能

## 故障排除

### 连接失败
- 检查PostgreSQL服务是否运行：`net start postgresql-x64-14`
- 检查防火墙设置
- 验证.env文件配置

### 权限问题
重新授予权限：
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tea_shop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tea_shop_user;
```

### 数据不一致
- 检查迁移日志输出
- 重新运行迁移脚本
- 对比SQLite和PostgreSQL数据

## 回滚方案

如果需要回滚到SQLite：
1. 修改.env文件，启用SQLite配置
2. 恢复database.js文件
3. 重启服务器

## 生产环境建议

1. **使用连接池**：已在database-postgres.js中配置
2. **定期备份**：使用pg_dump工具
3. **监控性能**：使用pg_stat_statements扩展
4. **安全配置**：
   - 使用强密码
   - 限制连接来源
   - 启用SSL连接

## 备份命令

```bash
# 备份
pg_dump -U tea_shop_user -d tea_shop > backup.sql

# 恢复
psql -U tea_shop_user -d tea_shop < backup.sql
```