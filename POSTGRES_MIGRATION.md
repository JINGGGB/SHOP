# PostgreSQL 迁移指南

本指南将帮助你将奶茶店商城系统从SQLite迁移到PostgreSQL数据库。

## 📋 准备步骤

### 1. 安装 PostgreSQL

#### Windows 安装：
1. 访问 [PostgreSQL官网](https://www.postgresql.org/download/windows/)
2. 下载并运行安装程序
3. 安装过程中设置超级用户密码（记住这个密码！）
4. 默认端口：5432
5. 默认用户名：postgres

#### 验证安装：
```bash
psql --version
```

### 2. 创建数据库和用户

打开命令提示符（以管理员身份运行），执行以下命令：

```bash
# 连接到PostgreSQL（输入安装时设置的密码）
psql -U postgres -h localhost

# 在psql命令行中执行以下SQL：
CREATE DATABASE tea_shop;
CREATE USER tea_shop_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tea_shop TO tea_shop_user;

# 连接到新数据库并授权模式权限
\c tea_shop
GRANT ALL ON SCHEMA public TO tea_shop_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tea_shop_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tea_shop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tea_shop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tea_shop_user;

# 退出psql
\q
```

## ⚙️ 配置应用

### 3. 创建环境配置文件

复制示例配置文件并编辑：
```bash
copy .env.example .env
```

编辑 `.env` 文件，填入你的数据库信息：
```env
# PostgreSQL 数据库配置
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tea_shop
DB_USER=tea_shop_user
DB_PASSWORD=your_secure_password

# 其他配置...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
JWT_SECRET=your_jwt_secret_here
PORT=3001
```

### 4. 创建数据库表结构

使用提供的SQL脚本创建表：
```bash
psql -U tea_shop_user -d tea_shop -h localhost -f database/postgres_schema.sql
```

输入数据库用户密码（在.env文件中设置的密码）。

## 🔄 数据迁移

### 5. 迁移现有数据

如果你有现有的SQLite数据需要迁移：

```bash
# 运行迁移脚本
node migrate-to-postgres.js
```

这个脚本会：
- 从SQLite读取现有数据
- 将数据转换为PostgreSQL格式
- 插入到PostgreSQL数据库中

### 6. 更新应用代码

需要将应用切换到使用PostgreSQL版本的数据库模块：

1. **备份原文件：**
   ```bash
   copy server\models\database.js server\models\database-sqlite.js
   ```

2. **替换为PostgreSQL版本：**
   ```bash
   copy server\models\database-postgres.js server\models\database.js
   ```

## ✅ 测试和验证

### 7. 测试数据库连接

创建测试脚本 `test-db.js`：
```javascript
require('dotenv').config();
const { initializeDatabase } = require('./server/models/database');

async function testConnection() {
    try {
        const db = await initializeDatabase();
        console.log('✅ 数据库连接成功');
        
        // 测试查询
        const users = await db.getAllUsers();
        console.log(`✅ 找到 ${users.length} 个用户`);
        
        const products = await db.getAllProducts();
        console.log(`✅ 找到 ${products.length} 个商品`);
        
        await db.close();
        console.log('✅ 所有测试通过');
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

testConnection();
```

运行测试：
```bash
node test-db.js
```

### 8. 启动应用

```bash
npm start
```

或开发模式：
```bash
npm run dev
```

## 🔧 故障排除

### 常见问题：

1. **连接被拒绝**
   - 检查PostgreSQL服务是否运行
   - 验证端口5432是否开放
   - 确认.env文件中的连接信息正确

2. **认证失败**
   - 验证用户名和密码
   - 确认用户有足够权限

3. **权限错误**
   - 确保数据库用户有正确的权限
   - 重新运行权限授权命令

### 检查PostgreSQL服务状态：

**Windows:**
```bash
# 检查服务状态
sc query postgresql-x64-16

# 启动服务（如果未运行）
net start postgresql-x64-16
```

### 查看PostgreSQL日志：
通常位于：`C:\Program Files\PostgreSQL\16\data\log\`

## 📊 性能优化

迁移完成后，建议进行以下优化：

1. **更新统计信息：**
   ```sql
   ANALYZE;
   ```

2. **重建索引：**
   ```sql
   REINDEX DATABASE tea_shop;
   ```

## 🔄 回滚计划

如果迁移出现问题，可以回滚到SQLite：

1. 恢复原数据库文件：
   ```bash
   copy server\models\database-sqlite.js server\models\database.js
   ```

2. 更新.env文件，注释掉PostgreSQL配置

3. 重启应用

## 📝 迁移后清理

迁移成功后，你可以：

1. 备份SQLite数据库文件
2. 删除迁移相关的临时文件
3. 更新文档和部署脚本

## 🎉 完成！

恭喜！你已经成功将应用迁移到PostgreSQL。现在你可以享受PostgreSQL提供的：

- 更好的并发性能
- 更强的数据一致性
- 更丰富的数据类型
- 更强大的查询功能
- 更好的扩展性

如有问题，请检查PostgreSQL和应用日志获取详细错误信息。