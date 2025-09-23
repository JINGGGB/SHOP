const express = require('express');
const jwt = require('jsonwebtoken');
const { database } = require('../models/database');

const router = express.Router();

// 验证token中间件
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }

    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'exists' : 'undefined');
    console.log('Token received:', token.substring(0, 50) + '...');
    
    // 尝试验证标准JWT令牌
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Standard JWT token decoded successfully:', decoded);
        req.user = decoded;
        next();
        return;
    } catch (jwtError) {
        console.log('Standard JWT verification failed:', jwtError.message);
        console.log('Trying manager token format...');
    }
    
    // 尝试解析前端生成的店长令牌
    const parts = token.split('.');
    if (parts.length === 3) {
        try {
            // 使用Buffer.from替代atob在Node.js环境下解码base64
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            console.log('Parsed payload from manager token:', payload);
            if (payload.role === 'manager' && payload.email) {
                console.log('Manager token decoded successfully:', payload);
                req.user = {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role
                };
                next();
                return;
            }
        } catch (parseError) {
            console.log('Manager token parsing failed:', parseError.message);
        }
    }
    
    console.log('All token verification methods failed');
    res.status(401).json({
        success: false,
        message: '认证令牌无效'
    });
}

// 验证店长权限中间件
async function verifyManager(req, res, next) {
    try {
        // 如果令牌中已有角色信息且为manager，直接通过
        if (req.user.role === 'manager') {
            next();
            return;
        }
        
        // 否则从数据库查询用户角色
        const user = await database.findUserByEmail(req.user.email);
        if (!user || user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: '需要店长权限'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '权限验证失败'
        });
    }
}

// 获取所有商品（公开访问）
router.get('/', async (req, res) => {
    try {
        const products = await database.getAllProducts();
        res.json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error('获取商品列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// ============ 分类管理相关路由 ============

// 获取所有分类（公开访问）
router.get('/categories', async (req, res) => {
    try {
        const categories = await database.getAllCategories();
        
        // 为每个分类添加使用数量
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await database.getCategoryUsageCount(category.name);
                return { ...category, productCount: count };
            })
        );
        
        res.json({
            success: true,
            data: categoriesWithCount
        });
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类失败'
        });
    }
});

// 创建新分类（仅店长）
router.post('/categories', verifyToken, verifyManager, async (req, res) => {
    try {
        const { name, emoji } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '分类名称不能为空'
            });
        }
        
        const result = await database.createCategory(name, emoji || '📦');
        
        res.json({
            success: true,
            message: '分类创建成功',
            data: result
        });
    } catch (error) {
        console.error('创建分类失败:', error);
        
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                success: false,
                message: '分类名称已存在'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '创建分类失败'
        });
    }
});

// 更新分类（仅店长）
router.put('/categories/:id', verifyToken, verifyManager, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, emoji } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '分类名称不能为空'
            });
        }
        
        // 检查分类是否存在
        const category = await database.getCategoryById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        await database.updateCategory(id, name, emoji || category.emoji);
        
        res.json({
            success: true,
            message: '分类更新成功'
        });
    } catch (error) {
        console.error('更新分类失败:', error);
        
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                success: false,
                message: '分类名称已存在'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '更新分类失败'
        });
    }
});

// 删除分类（仅店长）
router.delete('/categories/:id', verifyToken, verifyManager, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查分类是否存在
        const category = await database.getCategoryById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        await database.deleteCategory(id);
        
        res.json({
            success: true,
            message: '分类删除成功'
        });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ============ 用户管理相关路由 ============

// 获取所有用户（仅管理员）
router.get('/users', verifyToken, verifyManager, async (req, res) => {
    console.log('=== 用户管理路由被访问 ===');
    try {
        const users = await database.getAllUsers();
        
        // 为需要更新的用户更新统计数据（5分钟缓存）
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                if (user.email) {
                    const shouldUpdate = await database.shouldUpdateUserStats(user.email);
                    if (shouldUpdate) {
                        console.log(`更新用户 ${user.email} 的统计数据`);
                        await database.updateUserStats(user.email);
                        const updatedUser = await database.get('SELECT * FROM users WHERE id = $1', [user.id]);
                        return updatedUser;
                    } else {
                        console.log(`用户 ${user.email} 统计数据无需更新（缓存有效）`);
                        return user;
                    }
                }
                return user;
            })
        );
        
        res.json({
            success: true,
            users: usersWithStats
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取用户详细信息和统计（仅管理员）
router.get('/users/:id', verifyToken, verifyManager, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await database.get('SELECT * FROM users WHERE id = $1', [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const orderStats = await database.getUserOrderStats(userId);
        const orderHistory = await database.getUserOrderHistory(userId);
        
        res.json({
            success: true,
            user: user,
            stats: orderStats,
            orders: orderHistory
        });
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新用户角色（仅管理员）
router.put('/users/:id/role', verifyToken, verifyManager, async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        
        if (!['user', 'manager'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的角色类型'
            });
        }
        
        // 防止用户修改自己的角色为普通用户
        if (req.user.userId == userId && role === 'user') {
            return res.status(403).json({
                success: false,
                message: '不能将自己的角色修改为普通用户'
            });
        }
        
        const result = await database.updateUserRole(userId, role);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: '用户角色更新成功'
        });
    } catch (error) {
        console.error('更新用户角色失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新用户状态（仅管理员）
router.put('/users/:id/status', verifyToken, verifyManager, async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;
        
        if (!['active', 'disabled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态类型'
            });
        }
        
        // 防止用户禁用自己的账号
        if (req.user.userId == userId && status === 'disabled') {
            return res.status(403).json({
                success: false,
                message: '不能禁用自己的账号'
            });
        }
        
        const result = await database.updateUserStatus(userId, status);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: status === 'active' ? '用户已启用' : '用户已禁用'
        });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新用户备注（仅管理员）
router.put('/users/:id/nickname', verifyToken, verifyManager, async (req, res) => {
    try {
        const userId = req.params.id;
        const { nickname } = req.body;
        
        const result = await database.updateUserNickname(userId, nickname || null);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: '用户备注更新成功'
        });
    } catch (error) {
        console.error('更新用户备注失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 删除用户（仅管理员）
router.delete('/users/:id', verifyToken, verifyManager, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // 防止用户删除自己的账号
        if (req.user.userId == userId) {
            return res.status(403).json({
                success: false,
                message: '不能删除自己的账号'
            });
        }
        
        // 检查用户是否存在
        const user = await database.get('SELECT * FROM users WHERE id = $1', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 删除用户相关的订单记录
        await database.run('DELETE FROM orders WHERE customer_email = $1', [user.email]);
        
        // 删除用户
        const result = await database.run('DELETE FROM users WHERE id = $1', [userId]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '删除失败，用户不存在'
            });
        }
        
        res.json({
            success: true,
            message: '用户已成功删除'
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取单个商品详情（公开访问）
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await database.getProductById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        res.json({
            success: true,
            product: product
        });
    } catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取商品分类（公开访问）
router.get('/categories/list', async (req, res) => {
    try {
        const products = await database.getAllProducts();
        const categories = [...new Set(products.map(p => p.category))];
        
        res.json({
            success: true,
            categories: categories
        });
    } catch (error) {
        console.error('获取商品分类失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 创建新商品（仅店长 - 暂时开放无需认证）
router.post('/', async (req, res) => {
    try {
        const { name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel, isHot, hotPriority, hotBadgeText } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: '商品名称、价格和分类为必填项'
            });
        }

        const product = await database.createProduct(
            name,
            description,
            price,
            imageUrl,
            category,
            stock || 0,
            hasSweetness || false,
            hasIceLevel || false,
            isHot || false,
            hotPriority || 50,
            hotBadgeText || '🔥爆款'
        );

        res.json({
            success: true,
            message: '商品创建成功',
            product: { id: product.id, name, description, price, imageUrl, category, stock }
        });
    } catch (error) {
        console.error('创建商品失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新商品（仅店长 - 暂时开放测试）
router.put('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel, isHot, hotPriority, hotBadgeText, discountPrice } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: '商品名称、价格和分类为必填项'
            });
        }

        const result = await database.updateProduct(
            productId,
            name,
            description,
            price,
            imageUrl,
            category,
            stock,
            hasSweetness || false,
            hasIceLevel || false,
            isHot || false,
            hotPriority || 50,
            hotBadgeText || '🔥爆款',
            discountPrice || null
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        res.json({
            success: true,
            message: '商品更新成功'
        });
    } catch (error) {
        console.error('更新商品失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 设置/取消爆款（需要店长权限）
router.put('/:id/hot', verifyToken, verifyManager, async (req, res) => {
    try {
        const { id } = req.params;
        const { isHot, hotPriority, hotBadgeText } = req.body;

        const result = await database.run(
            'UPDATE products SET is_hot = ?, hot_priority = ?, hot_badge_text = ? WHERE id = ?',
            [isHot ? 1 : 0, hotPriority || 0, hotBadgeText || '爆款', id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        res.json({
            success: true,
            message: isHot ? '已设置为爆款商品' : '已取消爆款状态'
        });
    } catch (error) {
        console.error('设置爆款失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 删除商品（仅店长 - 暂时开放无需认证）
router.delete('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await database.deleteProduct(productId);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        res.json({
            success: true,
            message: '商品删除成功'
        });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取用户角色信息
router.get('/user/role', verifyToken, async (req, res) => {
    try {
        // 如果令牌中已有角色信息，直接返回
        if (req.user.role) {
            res.json({
                success: true,
                role: req.user.role
            });
            return;
        }
        
        // 否则从数据库查询
        const user = await database.findUserByEmail(req.user.email);
        res.json({
            success: true,
            role: user?.role || 'user'
        });
    } catch (error) {
        console.error('获取用户角色失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取当前用户的购买历史和统计（需要认证）
router.get('/user/purchases', verifyToken, async (req, res) => {
    try {
        // 根据邮箱获取用户购买历史
        const userEmail = req.user.email;
        
        // 获取购买统计
        const stats = await database.get(`
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(total_price), 0) as total_amount
            FROM orders 
            WHERE customer_email = ?
        `, [userEmail]);
        
        // 获取购买历史
        const orders = await database.all(`
            SELECT * FROM orders 
            WHERE customer_email = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [userEmail]);
        
        // 解析订单中的定制信息
        const ordersWithParsedCustomization = orders.map(order => ({
            ...order,
            customization: order.customization ? JSON.parse(order.customization) : null
        }));
        
        res.json({
            success: true,
            stats: {
                orderCount: parseInt(stats.order_count) || 0,
                totalAmount: parseFloat(stats.total_amount) || 0
            },
            orders: ordersWithParsedCustomization
        });
    } catch (error) {
        console.error('获取用户购买数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 升级为店长（公开访问，需要密码）
router.post('/upgrade-manager', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 检查邮箱是否包含 "jing"（不区分大小写）
        const isManagerEmail = email.toLowerCase().includes('jing');
        
        if (!email || (!password && !isManagerEmail)) {
            return res.status(400).json({
                success: false,
                message: isManagerEmail ? '邮箱地址为必填项' : '邮箱和密码为必填项'
            });
        }
        
        await database.upgradeToManager(email, password);
        
        res.json({
            success: true,
            message: '升级为店长成功'
        });
    } catch (error) {
        console.error('升级为店长失败:', error);
        res.status(400).json({
            success: false,
            message: error.message || '升级失败'
        });
    }
});

// 购买商品接口（支持认证和访客购买）
router.post('/purchase', async (req, res) => {
    console.log('=== 购买请求到达服务器 ===');
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);

    try {
        const { productId, quantity = 1, customization } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: '缺少商品ID'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: '购买数量必须大于0'
            });
        }

        // 获取商品信息
        const product = await database.getProductById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }

        // 检查库存
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: '库存不足'
            });
        }

        // 扣减库存
        const newStock = product.stock - quantity;
        await database.updateProductStock(productId, newStock);

        // 确定客户邮箱（优先使用认证用户，否则使用访客）
        let customerEmail = 'guest@shop.com';
        console.log('=== 用户身份识别开始 ===');

        // 尝试获取认证用户信息
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Authorization token存在:', !!token);

        if (token) {
            console.log('Token前50字符:', token.substring(0, 50) + '...');
            try {
                // 尝试验证标准JWT令牌
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('✅ 标准JWT令牌解析成功:', {
                    email: decoded.email,
                    role: decoded.role,
                    userId: decoded.userId
                });
                customerEmail = decoded.email;
            } catch (jwtError) {
                console.log('❌ 标准JWT验证失败:', jwtError.message);
                console.log('尝试管理员token格式...');

                // 尝试解析前端生成的店长令牌
                const parts = token.split('.');
                if (parts.length === 3) {
                    try {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                        console.log('✅ 管理员token解析成功:', {
                            email: payload.email,
                            role: payload.role,
                            userId: payload.userId
                        });
                        if (payload.email) {
                            customerEmail = payload.email;
                        }
                    } catch (parseError) {
                        console.log('❌ 管理员token解析失败:', parseError.message);
                        console.log('使用访客身份');
                    }
                } else {
                    console.log('❌ Token格式不正确，部分数量:', parts.length);
                }
            }
        } else {
            console.log('⚠️ 未提供认证token，使用访客身份');
        }

        console.log('🎯 最终确定的购买用户邮箱:', customerEmail);
        console.log('=== 用户身份识别完成 ===');

        console.log('🛒 开始创建订单...');
        const order = await database.createOrder(
            productId,
            product.name,
            product.image_url,
            quantity,
            product.price,
            product.price * quantity,
            customization,
            customerEmail
        );
        console.log('✅ 订单创建成功:', {
            订单ID: order.id,
            商品: product.name,
            数量: quantity,
            总价: product.price * quantity,
            客户邮箱: customerEmail
        });

        // 实时更新用户统计数据
        console.log('📊 开始更新用户统计数据...');
        await database.updateUserStats(customerEmail);
        console.log('✅ 用户统计数据更新完成');
        
        res.json({
            success: true,
            message: '购买成功',
            data: {
                productId: productId,
                quantity: quantity,
                totalPrice: product.price * quantity,
                remainingStock: newStock,
                customization: customization || null
            }
        });
        
    } catch (error) {
        console.error('购买商品失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取所有订单（仅店长）
router.get('/orders', async (req, res) => {
    try {
        const orders = await database.getAllOrders();
        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取未读订单数量（仅店长）
router.get('/orders/unread-count', async (req, res) => {
    try {
        const count = await database.getUnreadOrdersCount();
        res.json({
            success: true,
            count: count
        });
    } catch (error) {
        console.error('获取未读订单数量失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 标记订单为已读（仅店长）
router.post('/orders/:id/mark-read', async (req, res) => {
    try {
        const orderId = req.params.id;
        await database.markOrderAsRead(orderId);
        res.json({
            success: true,
            message: '订单已标记为已读'
        });
    } catch (error) {
        console.error('标记订单为已读失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 标记所有订单为已读（仅店长）
router.post('/orders/mark-all-read', async (req, res) => {
    try {
        await database.markAllOrdersAsRead();
        res.json({
            success: true,
            message: '所有订单已标记为已读'
        });
    } catch (error) {
        console.error('标记所有订单为已读失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;