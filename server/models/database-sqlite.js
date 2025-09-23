const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// SQLite 数据库文件路径
const dbPath = path.join(__dirname, '..', 'database', 'app.db');

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('数据库连接失败:', err);
                    reject(err);
                } else {
                    console.log('SQLite 数据库连接成功');
                    // 启用外键约束
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve(true);
                }
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async createTables() {
        try {
            // 创建完整的用户表
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    phone TEXT,
                    email TEXT UNIQUE,
                    username TEXT NOT NULL DEFAULT '用户',
                    password TEXT,
                    avatar TEXT DEFAULT '👤',
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            `;

            await this.run(createUsersTable);

            // 扩展用户表 - 添加新字段
            try {
                await this.run('ALTER TABLE users ADD COLUMN nickname TEXT');
                console.log('添加nickname字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('nickname字段已存在或添加失败:', error.message);
                }
            }

            try {
                await this.run('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"');
                console.log('添加status字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('status字段已存在或添加失败:', error.message);
                }
            }

            try {
                await this.run('ALTER TABLE users ADD COLUMN total_orders INTEGER DEFAULT 0');
                console.log('添加total_orders字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('total_orders字段已存在或添加失败:', error.message);
                }
            }

            try {
                await this.run('ALTER TABLE users ADD COLUMN total_spent REAL DEFAULT 0');
                console.log('添加total_spent字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('total_spent字段已存在或添加失败:', error.message);
                }
            }

            try {
                await this.run('ALTER TABLE users ADD COLUMN stats_updated_at DATETIME');
                console.log('添加stats_updated_at字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('stats_updated_at字段已存在或添加失败:', error.message);
                }
            }

            // 创建产品表
            const createProductsTable = `
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price REAL NOT NULL,
                    image_url TEXT,
                    category TEXT,
                    stock INTEGER DEFAULT 0,
                    has_sweetness INTEGER DEFAULT 0,
                    has_ice_level INTEGER DEFAULT 0,
                    is_hot INTEGER DEFAULT 0,
                    hot_priority INTEGER DEFAULT 0,
                    hot_badge_text TEXT DEFAULT '爆款',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await this.run(createProductsTable);

            // 添加折扣相关字段到products表
            try {
                await this.run('ALTER TABLE products ADD COLUMN discount_price REAL');
                console.log('添加discount_price字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('discount_price字段已存在或添加失败:', error.message);
                }
            }

            try {
                await this.run('ALTER TABLE products ADD COLUMN discount_percentage INTEGER');
                console.log('添加discount_percentage字段成功');
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    console.log('discount_percentage字段已存在或添加失败:', error.message);
                }
            }

            // 创建验证码表
            const createVerificationCodesTable = `
                CREATE TABLE IF NOT EXISTS verification_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    code TEXT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    used INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await this.run(createVerificationCodesTable);

            // 创建分类表
            const createCategoriesTable = `
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    emoji TEXT DEFAULT '📦',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await this.run(createCategoriesTable);

            // 创建订单表
            const createOrdersTable = `
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    product_image TEXT,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    price REAL NOT NULL,
                    total_price REAL NOT NULL,
                    customization TEXT,
                    customer_email TEXT,
                    status TEXT DEFAULT 'pending',
                    is_read INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products (id)
                )
            `;

            await this.run(createOrdersTable);

            console.log('users表创建成功');
            console.log('products表创建成功');
            console.log('verification_codes表创建成功');
            console.log('categories表创建成功');
            console.log('orders表创建成功');
        } catch (error) {
            console.error('创建表失败:', error);
            throw error;
        }
    }

    async findUserByPhone(phone) {
        try {
            return await this.get('SELECT * FROM users WHERE phone = ?', [phone]);
        } catch (error) {
            throw error;
        }
    }

    async findUserByUsername(username) {
        try {
            return await this.get('SELECT * FROM users WHERE username = ?', [username]);
        } catch (error) {
            throw error;
        }
    }

    async findUserByPhoneAndName(phone, username) {
        try {
            return await this.get('SELECT * FROM users WHERE phone = ? AND username = ?', [phone, username]);
        } catch (error) {
            throw error;
        }
    }

    async createUser(phone, username, password = null) {
        try {
            // 检查是否是店长手机号
            const role = phone === '13800138000' ? 'manager' : 'user';
            
            // 如果提供了密码，进行加密
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
            
            const result = await this.run(
                'INSERT INTO users (phone, username, password, role) VALUES (?, ?, ?, ?)',
                [phone, username, hashedPassword, role]
            );
            
            return { id: result.id, phone, username, role };
        } catch (error) {
            throw error;
        }
    }

    async setUserRole(phone, role) {
        try {
            await this.run('UPDATE users SET role = ? WHERE phone = ?', [role, phone]);
        } catch (error) {
            throw error;
        }
    }

    async updateUserProfile(userId, username, avatar, phone) {
        try {
            const result = await this.run(
                'UPDATE users SET username = ?, avatar = ?, phone = ? WHERE id = ?',
                [username, avatar, phone, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers() {
        try {
            return await this.all(
                'SELECT id, phone, email, username, avatar, role, nickname, status, total_orders, total_spent, created_at, last_login FROM users ORDER BY created_at DESC'
            );
        } catch (error) {
            throw error;
        }
    }

    // 获取用户订单统计
    async getUserOrderStats(userId) {
        try {
            const stats = await this.get(`
                SELECT 
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_price), 0) as total_amount,
                    MAX(created_at) as last_order_date
                FROM orders 
                WHERE customer_email = (SELECT email FROM users WHERE id = ?)
            `, [userId]);
            
            return {
                orderCount: parseInt(stats.order_count) || 0,
                totalAmount: parseFloat(stats.total_amount) || 0,
                lastOrderDate: stats.last_order_date
            };
        } catch (error) {
            throw error;
        }
    }

    // 获取用户订单历史
    async getUserOrderHistory(userId) {
        try {
            const orders = await this.all(`
                SELECT * FROM orders 
                WHERE customer_email = (SELECT email FROM users WHERE id = ?)
                ORDER BY created_at DESC
            `, [userId]);
            
            return orders.map(order => ({
                ...order,
                customization: order.customization ? JSON.parse(order.customization) : null
            }));
        } catch (error) {
            throw error;
        }
    }

    // 更新用户统计数据
    async updateUserStats(userEmail) {
        try {
            console.log(`📊 开始更新用户统计数据: ${userEmail}`);

            const stats = await this.get(`
                SELECT
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_price), 0) as total_amount
                FROM orders
                WHERE customer_email = ?
            `, [userEmail]);

            console.log(`📊 用户 ${userEmail} 的订单统计:`, {
                订单数量: stats.order_count,
                总消费金额: stats.total_amount
            });

            const updateResult = await this.run(`
                UPDATE users
                SET total_orders = ?, total_spent = ?, stats_updated_at = CURRENT_TIMESTAMP
                WHERE email = ?
            `, [stats.order_count, stats.total_amount, userEmail]);

            console.log(`📊 用户统计更新结果: 影响${updateResult.changes}行`);

            // 验证更新结果
            const updatedUser = await this.get(`
                SELECT email, total_orders, total_spent
                FROM users
                WHERE email = ?
            `, [userEmail]);

            if (updatedUser) {
                console.log(`✅ 用户 ${userEmail} 统计更新成功:`, {
                    总订单数: updatedUser.total_orders,
                    总消费: updatedUser.total_spent
                });
            } else {
                console.log(`⚠️ 用户 ${userEmail} 不存在于用户表中`);
            }

            return true;
        } catch (error) {
            console.error(`❌ 更新用户 ${userEmail} 统计数据失败:`, error);
            throw error;
        }
    }

    // 检查用户统计数据是否需要更新（5分钟缓存）
    async shouldUpdateUserStats(userEmail) {
        try {
            const user = await this.get(`
                SELECT stats_updated_at 
                FROM users 
                WHERE email = ?
            `, [userEmail]);
            
            if (!user || !user.stats_updated_at) {
                return true; // 从未更新过，需要更新
            }
            
            const lastUpdated = new Date(user.stats_updated_at);
            const now = new Date();
            const diffMinutes = (now - lastUpdated) / (1000 * 60);
            
            return diffMinutes > 5; // 超过5分钟才更新
        } catch (error) {
            console.error('检查统计更新时间失败:', error);
            return true; // 出错时默认更新
        }
    }

    // 更新用户备注
    async updateUserNickname(userId, nickname) {
        try {
            const result = await this.run(
                'UPDATE users SET nickname = ? WHERE id = ?',
                [nickname, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 更新用户状态
    async updateUserStatus(userId, status) {
        try {
            const result = await this.run(
                'UPDATE users SET status = ? WHERE id = ?',
                [status, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 更新用户角色
    async updateUserRole(userId, role) {
        try {
            const result = await this.run(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async verifyPassword(userId, password) {
        try {
            const user = await this.get('SELECT password FROM users WHERE id = ?', [userId]);
            
            if (!user || !user.password) {
                return false; // 用户不存在或没有设置密码
            }
            
            const isValid = await bcrypt.compare(password, user.password);
            return isValid;
        } catch (error) {
            throw error;
        }
    }

    async updatePassword(userId, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await this.run(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async hasPassword(userId) {
        try {
            const user = await this.get('SELECT password FROM users WHERE id = ?', [userId]);
            return user && user.password !== null;
        } catch (error) {
            throw error;
        }
    }

    async findUserByEmail(email) {
        try {
            return await this.get('SELECT * FROM users WHERE email = ?', [email]);
        } catch (error) {
            throw error;
        }
    }

    async upgradeToManager(userEmail, password) {
        try {
            // 检查邮箱是否包含 "jing"（不区分大小写）
            const isManagerEmail = userEmail.toLowerCase().includes('jing');
            
            // 对于包含jing的邮箱，不需要密码验证；其他邮箱需要密码
            if (!isManagerEmail && password !== 'newpassword2024') {
                throw new Error('升级密码错误');
            }
            
            // 检查用户是否存在，如果不存在则创建
            let user = await this.findUserByEmail(userEmail);
            if (!user) {
                const username = isManagerEmail ? 'Jing店长' : '店长用户';
                console.log(`用户 ${userEmail} 不存在，创建新用户`);
                await this.createUserByEmail(userEmail, username);
                user = await this.findUserByEmail(userEmail);
            }
            
            // 如果用户已经是店长就不需要再升级
            if (user.role === 'manager') {
                console.log(`用户 ${userEmail} 已经是店长`);
                return true;
            }
            
            // 升级用户为店长
            await this.setUserRoleByEmail(userEmail, 'manager');
            console.log(`用户 ${userEmail} 已升级为店长`);
            return true;
        } catch (error) {
            console.error('升级为店长失败:', error);
            throw error;
        }
    }

    async setUserRoleByEmail(email, role) {
        try {
            await this.run('UPDATE users SET role = ? WHERE email = ?', [role, email]);
        } catch (error) {
            throw error;
        }
    }

    async createUserByEmail(email, username, password = null) {
        try {
            // 检查邮箱是否包含 "jing"（不区分大小写）
            const isManagerEmail = email.toLowerCase().includes('jing');
            const role = isManagerEmail ? 'manager' : 'user';
            
            // 如果提供了密码，进行加密
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
            
            const result = await this.run(
                'INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)',
                [email, username, hashedPassword, role]
            );
            
            console.log(`创建用户: ${email}, 角色: ${role}`);
            return { id: result.id, email, username, role };
        } catch (error) {
            throw error;
        }
    }

    async updateLastLogin(email) {
        try {
            await this.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?', [email]);
        } catch (error) {
            throw error;
        }
    }

    async saveVerificationCode(email, code, expiresAt) {
        try {
            // 先清理该邮箱的旧验证码
            await this.run(
                'UPDATE verification_codes SET used = 1 WHERE email = ? AND used = 0',
                [email]
            );

            // 插入新验证码
            const result = await this.run(
                'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
                [email, code, expiresAt]
            );
            
            return { id: result.id };
        } catch (error) {
            throw error;
        }
    }

    async findValidVerificationCode(email, code) {
        try {
            const query = `
                SELECT * FROM verification_codes 
                WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
                ORDER BY created_at DESC LIMIT 1
            `;
            
            return await this.get(query, [email, code]);
        } catch (error) {
            throw error;
        }
    }

    async markVerificationCodeAsUsed(id) {
        try {
            await this.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [id]);
        } catch (error) {
            throw error;
        }
    }

    async cleanExpiredCodes() {
        try {
            await this.run('DELETE FROM verification_codes WHERE expires_at < datetime("now")');
        } catch (error) {
            throw error;
        }
    }

    async checkRecentCodeRequest(email, minutes = 1) {
        try {
            const query = `
                SELECT * FROM verification_codes 
                WHERE email = ? AND created_at > datetime('now', '-${minutes} minutes')
                ORDER BY created_at DESC LIMIT 1
            `;
            
            return await this.get(query, [email]);
        } catch (error) {
            throw error;
        }
    }

    // 商品相关方法
    async getAllProducts() {
        try {
            // 按爆款优先级降序，然后按创建时间降序
            return await this.all('SELECT * FROM products ORDER BY hot_priority DESC, created_at DESC');
        } catch (error) {
            throw error;
        }
    }

    async getProductById(id) {
        try {
            return await this.get('SELECT * FROM products WHERE id = ?', [id]);
        } catch (error) {
            throw error;
        }
    }

    async createProduct(name, description, price, imageUrl, category, stock, hasSweetness = false, hasIceLevel = false, isHot = false, hotPriority = 50, hotBadgeText = '🔥爆款') {
        try {
            const result = await this.run(
                'INSERT INTO products (name, description, price, image_url, category, stock, has_sweetness, has_ice_level, is_hot, hot_priority, hot_badge_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, description, price, imageUrl, category, stock, hasSweetness ? 1 : 0, hasIceLevel ? 1 : 0, isHot ? 1 : 0, hotPriority, hotBadgeText]
            );
            return { id: result.id };
        } catch (error) {
            throw error;
        }
    }

    async clearAllProducts() {
        try {
            // 先删除引用商品的订单
            await this.run('DELETE FROM orders');
            // 再删除商品
            await this.run('DELETE FROM products');
            console.log('清理旧商品数据完成');
        } catch (error) {
            throw error;
        }
    }

    async initSampleProducts() {
        // 先清理旧数据
        await this.clearAllProducts();
        
        // 删除并重新创建 products 表以确保正确的结构
        try {
            await this.run('DROP TABLE IF EXISTS products');
            const createProductsTable = `
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price REAL NOT NULL,
                    image_url TEXT,
                    category TEXT,
                    stock INTEGER DEFAULT 0,
                    has_sweetness INTEGER DEFAULT 0,
                    has_ice_level INTEGER DEFAULT 0,
                    is_hot INTEGER DEFAULT 0,
                    hot_priority INTEGER DEFAULT 0,
                    hot_badge_text TEXT DEFAULT '爆款',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            await this.run(createProductsTable);
            console.log('重新创建 products 表成功');
        } catch (error) {
            console.error('重新创建表失败:', error);
        }
        
        const products = [
            // 柠檬饮料分类
            {
                name: '蜂蜜柠檬水',
                description: '精选天然蜂蜜配新鲜柠檬，清甜解腻',
                price: 18.00,
                imageUrl: '🍯',
                category: '柠檬饮料',
                stock: 35,
                isHot: 1,
                hotPriority: 100,
                hotBadgeText: '🔥爆款推荐'
            },
            {
                name: '柠檬汁',
                description: '100%纯柠檬汁，酸甜可口，富含维生素C',
                price: 15.50,
                imageUrl: '🍋',
                category: '柠檬饮料',
                stock: 40
            },
            // 果汁分类
            {
                name: '苹果汁',
                description: '新鲜苹果榨取，香甜可口，营养丰富',
                price: 12.00,
                imageUrl: '🍎',
                category: '果汁',
                stock: 45
            },
            {
                name: '橙汁',
                description: '鲜榨橙汁，维生素C含量丰富，口感清新',
                price: 14.00,
                imageUrl: '🍊',
                category: '果汁',
                stock: 38
            },
            // 牛奶分类
            {
                name: '牛奶',
                description: '新鲜纯牛奶，富含蛋白质和钙质',
                price: 8.50,
                imageUrl: '🥛',
                category: '牛奶',
                stock: 60
            },
            {
                name: '巧克力牛奶',
                description: '香浓巧克力与牛奶的完美融合',
                price: 11.00,
                imageUrl: '🍫',
                category: '牛奶',
                stock: 30
            },
            {
                name: '巧克力双拼',
                description: '双重巧克力口感，浓郁香甜',
                price: 16.50,
                imageUrl: '🍩',
                category: '牛奶',
                stock: 25,
                isHot: 1,
                hotPriority: 90,
                hotBadgeText: '⭐人气王'
            }
        ];

        for (const product of products) {
            try {
                // 为饮品类商品自动启用甜度和冰度支持
                const isDrink = ['柠檬饮料', '果汁', '牛奶'].includes(product.category);
                
                // 直接插入带爆款信息的商品
                await this.run(
                    'INSERT INTO products (name, description, price, image_url, category, stock, has_sweetness, has_ice_level, is_hot, hot_priority, hot_badge_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        product.name,
                        product.description,
                        product.price,
                        product.imageUrl,
                        product.category,
                        product.stock,
                        isDrink ? 1 : 0, // 饮品支持甜度
                        isDrink ? 1 : 0, // 饮品支持冰度
                        product.isHot || 0,
                        product.hotPriority || 0,
                        product.hotBadgeText || '爆款'
                    ]
                );
                const hotText = product.isHot ? ' (爆款)' : '';
                const customText = isDrink ? ' (支持甜度/冰度定制)' : '';
                console.log(`商品 "${product.name}" 创建成功${hotText}${customText}`);
            } catch (error) {
                console.error('初始化商品数据失败:', error);
            }
        }
        
        console.log('所有新商品数据初始化完成');
    }

    async updateProduct(id, name, description, price, imageUrl, category, stock, hasSweetness = false, hasIceLevel = false, isHot = false, hotPriority = 50, hotBadgeText = '🔥爆款', discountPrice = null) {
        try {
            // 计算折扣百分比
            let discountPercentage = 0;
            if (discountPrice && discountPrice < price) {
                discountPercentage = Math.round((1 - discountPrice / price) * 100);
            }

            const result = await this.run(
                'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ?, has_sweetness = ?, has_ice_level = ?, is_hot = ?, hot_priority = ?, hot_badge_text = ?, discount_price = ?, discount_percentage = ? WHERE id = ?',
                [name, description, price, imageUrl, category, stock, hasSweetness ? 1 : 0, hasIceLevel ? 1 : 0, isHot ? 1 : 0, hotPriority, hotBadgeText, discountPrice, discountPercentage, id]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async updateProductStock(id, newStock) {
        try {
            const result = await this.run(
                'UPDATE products SET stock = ? WHERE id = ?',
                [newStock, id]
            );
            return { changes: result.changes, newStock: newStock };
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const result = await this.run('DELETE FROM products WHERE id = ?', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 订单相关方法
    async createOrder(productId, productName, productImage, quantity, price, totalPrice, customization, customerEmail) {
        try {
            const result = await this.run(
                'INSERT INTO orders (product_id, product_name, product_image, quantity, price, total_price, customization, customer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [productId, productName, productImage, quantity, price, totalPrice, JSON.stringify(customization), customerEmail]
            );
            return { id: result.id };
        } catch (error) {
            throw error;
        }
    }

    async getAllOrders() {
        try {
            const orders = await this.all('SELECT * FROM orders ORDER BY created_at DESC');
            // 解析customization JSON
            const ordersWithParsedCustomization = orders.map(order => ({
                ...order,
                customization: order.customization ? JSON.parse(order.customization) : null
            }));
            return ordersWithParsedCustomization;
        } catch (error) {
            throw error;
        }
    }

    async getUnreadOrdersCount() {
        try {
            const result = await this.get('SELECT COUNT(*) as count FROM orders WHERE is_read = 0');
            return parseInt(result.count);
        } catch (error) {
            throw error;
        }
    }

    async markOrderAsRead(orderId) {
        try {
            const result = await this.run('UPDATE orders SET is_read = 1 WHERE id = ?', [orderId]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async markAllOrdersAsRead() {
        try {
            const result = await this.run('UPDATE orders SET is_read = 1 WHERE is_read = 0');
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 分类相关方法
    async getAllCategories() {
        try {
            return await this.all('SELECT * FROM categories ORDER BY created_at ASC');
        } catch (error) {
            throw error;
        }
    }

    async getCategoryById(id) {
        try {
            return await this.get('SELECT * FROM categories WHERE id = ?', [id]);
        } catch (error) {
            throw error;
        }
    }

    async createCategory(name, emoji = '📦') {
        try {
            const result = await this.run(
                'INSERT INTO categories (name, emoji) VALUES (?, ?)',
                [name, emoji]
            );
            return { id: result.id, name, emoji };
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(id, name, emoji) {
        try {
            const result = await this.run(
                'UPDATE categories SET name = ?, emoji = ? WHERE id = ?',
                [name, emoji, id]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            // 检查是否有商品使用该分类
            const productsCount = await this.get(
                'SELECT COUNT(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)',
                [id]
            );
            
            if (productsCount.count > 0) {
                throw new Error(`无法删除分类：还有 ${productsCount.count} 个商品使用此分类`);
            }
            
            const result = await this.run('DELETE FROM categories WHERE id = ?', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getCategoryUsageCount(categoryName) {
        try {
            const result = await this.get(
                'SELECT COUNT(*) as count FROM products WHERE category = ?',
                [categoryName]
            );
            return parseInt(result.count);
        } catch (error) {
            throw error;
        }
    }

    async initDefaultCategories() {
        try {
            // 检查是否已有分类
            const existingCategories = await this.getAllCategories();
            if (existingCategories.length > 0) {
                return; // 已有分类，跳过初始化
            }

            const defaultCategories = [
                { name: '柠檬饮料', emoji: '🍋' },
                { name: '果汁', emoji: '🍊' },
                { name: '牛奶', emoji: '🥛' },
                { name: '茶饮', emoji: '🍵' },
                { name: '咖啡', emoji: '☕' },
                { name: '小食', emoji: '🍪' }
            ];

            for (const category of defaultCategories) {
                await this.createCategory(category.name, category.emoji);
                console.log(`默认分类 "${category.name}" 创建成功`);
            }
            
            console.log('默认分类初始化完成');
        } catch (error) {
            console.error('初始化默认分类失败:', error);
        }
    }
}

const database = new Database();

async function initializeDatabase() {
    try {
        await database.connect();
        await database.createTables();
        
        // 启动时清理过期的验证码
        await database.cleanExpiredCodes();
        
        // 创建默认测试用户
        const testUser = await database.findUserByEmail('guest@shop.com');
        if (!testUser) {
            await database.createUserByEmail('guest@shop.com', '访客用户');
            console.log('默认测试用户创建成功');
        }
        
        // 初始化默认分类
        await database.initDefaultCategories();
        
        // 初始化示例商品数据
        await database.initSampleProducts();
        
        console.log('数据库初始化完成');
        return database;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

module.exports = { database, initializeDatabase };