const express = require('express');
const jwt = require('jsonwebtoken');
const { database } = require('../models/database');
const emailService = require('../services/emailService');

const router = express.Router();

// 生成6位数验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 密码登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '请输入邮箱和密码'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: '请输入有效的邮箱地址'
            });
        }

        // 查找用户
        const user = await database.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await database.verifyPassword(email, password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 更新最后登录时间
        await database.updateLastLogin(email);

        // 生成JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: '登录成功',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch (error) {
        console.error('密码登录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

// 请求验证码
router.post('/request-code', async (req, res) => {
    try {
        const { email } = req.body;

        // 验证邮箱格式
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: '请输入有效的邮箱地址'
            });
        }

        // 检查是否在1分钟内已经发送过验证码
        const recentCode = await database.checkRecentCodeRequest(email, 1);
        if (recentCode) {
            return res.status(429).json({
                success: false,
                message: '验证码发送过于频繁，请1分钟后再试'
            });
        }

        // 生成验证码
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

        // 保存验证码到数据库
        await database.saveVerificationCode(email, code, expiresAt);

        // 发送邮件
        const emailResult = await emailService.sendVerificationCode(email, code);
        
        if (emailResult.success) {
            res.json({
                success: true,
                message: '验证码已发送到您的邮箱，请查收'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '邮件发送失败，请稍后重试'
            });
        }
    } catch (error) {
        console.error('请求验证码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

// 验证登录
router.post('/verify-code', async (req, res) => {
    try {
        const { email, code, password } = req.body;

        // 验证输入
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: '请输入邮箱和验证码'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: '请输入有效的邮箱地址'
            });
        }

        // 验证码格式检查（6位数字）
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: '验证码格式错误'
            });
        }

        // 查找有效的验证码
        const validCode = await database.findValidVerificationCode(email, code);
        if (!validCode) {
            return res.status(401).json({
                success: false,
                message: '验证码错误或已过期'
            });
        }

        // 标记验证码为已使用
        await database.markVerificationCodeAsUsed(validCode.id);

        // 查找或创建用户
        let user = await database.findUserByEmail(email);
        if (!user) {
            // 新用户注册，需要设置密码
            if (!password || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: '新用户请设置至少6位数的密码'
                });
            }
            user = await database.createUser(email, password);
        } else {
            // 现有用户，如果没有密码则需要设置密码
            const hasPassword = await database.hasPassword(email);
            if (!hasPassword && password) {
                if (password.length < 6) {
                    return res.status(400).json({
                        success: false,
                        message: '请设置至少6位数的密码'
                    });
                }
                await database.updatePassword(email, password);
            }
        }

        // 更新最后登录时间
        await database.updateLastLogin(email);

        // 生成JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: '登录成功',
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('验证登录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

// 验证token中间件
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: '认证令牌无效'
        });
    }
}

// 获取用户信息（需要认证）
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await database.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar || '👤',
                role: user.role || 'user',
                created_at: user.created_at,
                last_login: user.last_login
            }
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新用户个人资料
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { username, avatar } = req.body;
        
        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const result = await database.updateUserProfile(req.user.email, username.trim(), avatar || '👤');
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: '个人资料更新成功'
        });
    } catch (error) {
        console.error('更新个人资料失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更改密码
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 验证新密码
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码至少需要6位'
            });
        }
        
        // 检查用户是否已有密码
        const hasPassword = await database.hasPassword(req.user.email);
        
        if (hasPassword) {
            // 如果已有密码，需要验证当前密码
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: '请输入当前密码'
                });
            }
            
            const isCurrentPasswordValid = await database.verifyPassword(req.user.email, currentPassword);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: '当前密码错误'
                });
            }
        }
        
        // 更新密码
        const result = await database.updatePassword(req.user.email, newPassword);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: hasPassword ? '密码修改成功' : '密码设置成功'
        });
    } catch (error) {
        console.error('更改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 检查用户是否已设置密码
router.get('/has-password', verifyToken, async (req, res) => {
    try {
        const hasPassword = await database.hasPassword(req.user.email);
        res.json({
            success: true,
            hasPassword: hasPassword
        });
    } catch (error) {
        console.error('检查密码状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;