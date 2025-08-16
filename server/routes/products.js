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

// 验证店长权限中间件
async function verifyManager(req, res, next) {
    try {
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
        const { name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel } = req.body;
        
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
            hasIceLevel || false
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

// 更新商品（仅店长 - 暂时开放无需认证）
router.put('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel } = req.body;
        
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
            hasIceLevel || false
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
        const user = await database.findUserByEmail(req.user.email);
        res.json({
            success: true,
            role: user.role || 'user'
        });
    } catch (error) {
        console.error('获取用户角色失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取所有用户（仅管理员）
router.get('/users', verifyToken, verifyManager, async (req, res) => {
    try {
        const users = await database.getAllUsers();
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
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

// 购买商品接口
router.post('/purchase', async (req, res) => {
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
        
        // 创建订单记录
        const order = await database.createOrder(
            productId,
            product.name,
            product.image_url,
            quantity,
            product.price,
            product.price * quantity,
            customization,
            'customer@example.com' // 暂时使用默认邮箱，后续可改为实际用户邮箱
        );
        
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