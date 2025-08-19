require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const { initializeDatabase } = require('./models/database');
const emailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);

// 默认路由 - 返回登录页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 初始化数据库并启动服务器
async function startServer() {
    try {
        await initializeDatabase();
        console.log('数据库初始化成功');
        
        // 跳过邮件服务配置验证，因为不需要登录功能
        console.log('⚠️ 跳过邮件服务验证（店长升级功能不需要真实邮箱）');
        
        app.listen(PORT, () => {
            console.log(`服务器运行在端口 ${PORT}`);
            console.log(`访问 http://localhost:${PORT} 查看应用`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

startServer();