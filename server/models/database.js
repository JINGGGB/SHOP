const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL 连接配置
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'shop_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class Database {
    constructor() {
        this.pool = pool;
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            console.log('PostgreSQL 数据库连接成功');
            client.release();
            return true;
        } catch (err) {
            console.error('数据库连接失败:', err);
            throw err;
        }
    }

    async createTables() {
        try {
            // 创建完整的用户表
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    phone TEXT,
                    email TEXT UNIQUE,
                    username TEXT NOT NULL DEFAULT '用户',
                    password TEXT,
                    avatar TEXT DEFAULT '👤',
                    role TEXT DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            `;

            await this.pool.query(createUsersTable);

            // PostgreSQL 不需要手动添加列，因为表已经定义完整


            // 创建产品表
            const createProductsTable = `
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    image_url TEXT,
                    category TEXT,
                    stock INTEGER DEFAULT 0,
                    has_sweetness BOOLEAN DEFAULT FALSE,
                    has_ice_level BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await this.pool.query(createProductsTable);

            // PostgreSQL 已在表创建时包含所有字段

            // 创建验证码表
            const createVerificationCodesTable = `
                CREATE TABLE IF NOT EXISTS verification_codes (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    code TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await this.pool.query(createVerificationCodesTable);

            // 创建订单表
            const createOrdersTable = `
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    product_image TEXT,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    price DECIMAL(10,2) NOT NULL,
                    total_price DECIMAL(10,2) NOT NULL,
                    customization TEXT,
                    customer_email TEXT,
                    status TEXT DEFAULT 'pending',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products (id)
                )
            `;

            await this.pool.query(createOrdersTable);

            console.log('users表创建成功');
            console.log('products表创建成功');
            console.log('verification_codes表创建成功');
            console.log('orders表创建成功');
        } catch (error) {
            console.error('创建表失败:', error);
            throw error;
        }
    }

    async findUserByPhone(phone) {
        try {
            const result = await this.pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async findUserByUsername(username) {
        try {
            const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async findUserByPhoneAndName(phone, username) {
        try {
            const result = await this.pool.query('SELECT * FROM users WHERE phone = $1 AND username = $2', [phone, username]);
            return result.rows[0] || null;
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
            
            const result = await this.pool.query(
                'INSERT INTO users (phone, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
                [phone, username, hashedPassword, role]
            );
            
            return { id: result.rows[0].id, phone, username, role };
        } catch (error) {
            throw error;
        }
    }

    async setUserRole(phone, role) {
        try {
            await this.pool.query('UPDATE users SET role = $1 WHERE phone = $2', [role, phone]);
        } catch (error) {
            throw error;
        }
    }

    async updateUserProfile(userId, username, avatar, phone) {
        try {
            const result = await this.pool.query(
                'UPDATE users SET username = $1, avatar = $2, phone = $3 WHERE id = $4',
                [username, avatar, phone, userId]
            );
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const result = await this.pool.query(
                'SELECT id, phone, username, avatar, role, created_at, last_login FROM users ORDER BY created_at DESC'
            );
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    async verifyPassword(userId, password) {
        try {
            const result = await this.pool.query('SELECT password FROM users WHERE id = $1', [userId]);
            const user = result.rows[0];
            
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
            const result = await this.pool.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, userId]
            );
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    async hasPassword(userId) {
        try {
            const result = await this.pool.query('SELECT password FROM users WHERE id = $1', [userId]);
            const user = result.rows[0];
            return user && user.password !== null;
        } catch (error) {
            throw error;
        }
    }


    async findUserByEmail(email) {
        try {
            const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0] || null;
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
            await this.pool.query('UPDATE users SET role = $1 WHERE email = $2', [role, email]);
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
            
            const result = await this.pool.query(
                'INSERT INTO users (email, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
                [email, username, hashedPassword, role]
            );
            
            console.log(`创建用户: ${email}, 角色: ${role}`);
            return { id: result.rows[0].id, email, username, role };
        } catch (error) {
            throw error;
        }
    }

    async updateLastLogin(email) {
        try {
            await this.pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1', [email]);
        } catch (error) {
            throw error;
        }
    }

    async saveVerificationCode(email, code, expiresAt) {
        try {
            // 先清理该邮箱的旧验证码
            await this.pool.query(
                'UPDATE verification_codes SET used = TRUE WHERE email = $1 AND used = FALSE',
                [email]
            );

            // 插入新验证码
            const result = await this.pool.query(
                'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3) RETURNING id',
                [email, code, expiresAt]
            );
            
            return { id: result.rows[0].id };
        } catch (error) {
            throw error;
        }
    }

    async findValidVerificationCode(email, code) {
        try {
            const query = `
                SELECT * FROM verification_codes 
                WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            `;
            
            const result = await this.pool.query(query, [email, code]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async markVerificationCodeAsUsed(id) {
        try {
            await this.pool.query('UPDATE verification_codes SET used = TRUE WHERE id = $1', [id]);
        } catch (error) {
            throw error;
        }
    }

    async cleanExpiredCodes() {
        try {
            await this.pool.query('DELETE FROM verification_codes WHERE expires_at < NOW()');
        } catch (error) {
            throw error;
        }
    }

    async checkRecentCodeRequest(email, minutes = 1) {
        try {
            const query = `
                SELECT * FROM verification_codes 
                WHERE email = $1 AND created_at > NOW() - INTERVAL '${minutes} minutes'
                ORDER BY created_at DESC LIMIT 1
            `;
            
            const result = await this.pool.query(query, [email]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // 商品相关方法
    async getAllProducts() {
        try {
            const result = await this.pool.query('SELECT * FROM products ORDER BY created_at DESC');
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const result = await this.pool.query('SELECT * FROM products WHERE id = $1', [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async createProduct(name, description, price, imageUrl, category, stock, hasSweetness = false, hasIceLevel = false) {
        try {
            const result = await this.pool.query(
                'INSERT INTO products (name, description, price, image_url, category, stock, has_sweetness, has_ice_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel]
            );
            return { id: result.rows[0].id };
        } catch (error) {
            throw error;
        }
    }

    async clearAllProducts() {
        try {
            await this.pool.query('DELETE FROM products');
            console.log('清理旧商品数据完成');
        } catch (error) {
            throw error;
        }
    }

    async initSampleProducts() {
        // 先清理旧数据
        await this.clearAllProducts();
        
        const products = [
            // 柠檬饮料分类
            {
                name: '蜂蜜柠檬水',
                description: '精选天然蜂蜜配新鲜柠檬，清甜解腻',
                price: 18.00,
                imageUrl: '🍯',
                category: '柠檬饮料',
                stock: 35
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
                stock: 25
            }
        ];

        for (const product of products) {
            try {
                // 为饮品类商品自动启用甜度和冰度支持
                const isDrink = ['柠檬饮料', '果汁', '牛奶'].includes(product.category);
                
                await this.createProduct(
                    product.name,
                    product.description,
                    product.price,
                    product.imageUrl,
                    product.category,
                    product.stock,
                    isDrink, // 饮品支持甜度
                    isDrink  // 饮品支持冰度
                );
                console.log(`商品 "${product.name}" 创建成功${isDrink ? ' (支持甜度/冰度定制)' : ''}`);
            } catch (error) {
                console.error('初始化商品数据失败:', error);
            }
        }
        
        console.log('所有新商品数据初始化完成');
    }

    async updateProduct(id, name, description, price, imageUrl, category, stock, hasSweetness = false, hasIceLevel = false) {
        try {
            const result = await this.pool.query(
                'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6, has_sweetness = $7, has_ice_level = $8 WHERE id = $9',
                [name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel, id]
            );
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    async updateProductStock(id, newStock) {
        try {
            const result = await this.pool.query(
                'UPDATE products SET stock = $1 WHERE id = $2',
                [newStock, id]
            );
            return { changes: result.rowCount, newStock: newStock };
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const result = await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    // 订单相关方法
    async createOrder(productId, productName, productImage, quantity, price, totalPrice, customization, customerEmail) {
        try {
            const result = await this.pool.query(
                'INSERT INTO orders (product_id, product_name, product_image, quantity, price, total_price, customization, customer_email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [productId, productName, productImage, quantity, price, totalPrice, JSON.stringify(customization), customerEmail]
            );
            return { id: result.rows[0].id };
        } catch (error) {
            throw error;
        }
    }

    async getAllOrders() {
        try {
            const result = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC');
            // 解析customization JSON
            const ordersWithParsedCustomization = result.rows.map(order => ({
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
            const result = await this.pool.query('SELECT COUNT(*) as count FROM orders WHERE is_read = FALSE');
            return parseInt(result.rows[0].count);
        } catch (error) {
            throw error;
        }
    }

    async markOrderAsRead(orderId) {
        try {
            const result = await this.pool.query('UPDATE orders SET is_read = TRUE WHERE id = $1', [orderId]);
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
        }
    }

    async markAllOrdersAsRead() {
        try {
            const result = await this.pool.query('UPDATE orders SET is_read = TRUE WHERE is_read = FALSE');
            return { changes: result.rowCount };
        } catch (error) {
            throw error;
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