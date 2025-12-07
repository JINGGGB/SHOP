const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
    }

    async connect() {
        try {
            // 创建PostgreSQL连接池
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'tea_shop',
                user: process.env.DB_USER || 'tea_shop_user',
                password: process.env.DB_PASSWORD,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // 测试连接
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            console.log('PostgreSQL 数据库连接成功');
            return true;
        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return result;
        } catch (error) {
            console.error('查询失败:', error);
            throw error;
        }
    }

    async run(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return { 
                id: result.rows[0]?.id, 
                changes: result.rowCount,
                rows: result.rows 
            };
        } catch (error) {
            throw error;
        }
    }

    async get(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async all(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // 创建表方法 - 简化版，实际建表使用SQL脚本
    async createTables() {
        console.log('表结构应通过database/postgres_schema.sql创建');
        return true;
    }

    async findUserByPhone(phone) {
        try {
            return await this.get('SELECT * FROM users WHERE phone = $1', [phone]);
        } catch (error) {
            throw error;
        }
    }

    async findUserByUsername(username) {
        try {
            return await this.get('SELECT * FROM users WHERE username = $1', [username]);
        } catch (error) {
            throw error;
        }
    }

    async findUserByPhoneAndName(phone, username) {
        try {
            return await this.get('SELECT * FROM users WHERE phone = $1 AND username = $2', [phone, username]);
        } catch (error) {
            throw error;
        }
    }

    async createUser(phone, username, password = null) {
        try {
            const role = phone === '13800138000' ? 'manager' : 'user';
            
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
            
            const result = await this.query(
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
            await this.run('UPDATE users SET role = $1 WHERE phone = $2', [role, phone]);
        } catch (error) {
            throw error;
        }
    }

    async updateUserProfile(userId, username, avatar, phone) {
        try {
            const result = await this.run(
                'UPDATE users SET username = $1, avatar = $2, phone = $3 WHERE id = $4',
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

    async getUserOrderStats(userId) {
        try {
            const stats = await this.get(`
                SELECT 
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_price), 0) as total_amount,
                    MAX(created_at) as last_order_date
                FROM orders 
                WHERE customer_email = (SELECT email FROM users WHERE id = $1)
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

    async getUserOrderHistory(userId) {
        try {
            const orders = await this.all(`
                SELECT * FROM orders 
                WHERE customer_email = (SELECT email FROM users WHERE id = $1)
                ORDER BY created_at DESC
            `, [userId]);
            
            return orders.map(order => ({
                ...order,
                customization: order.customization || null
            }));
        } catch (error) {
            throw error;
        }
    }

    async updateUserStats(userEmail) {
        try {
            const stats = await this.get(`
                SELECT 
                    COUNT(*) as order_count,
                    COALESCE(SUM(total_price), 0) as total_amount
                FROM orders 
                WHERE customer_email = $1
            `, [userEmail]);
            
            await this.run(`
                UPDATE users 
                SET total_orders = $1, total_spent = $2, stats_updated_at = CURRENT_TIMESTAMP
                WHERE email = $3
            `, [stats.order_count, stats.total_amount, userEmail]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    async shouldUpdateUserStats(userEmail) {
        try {
            const user = await this.get(`
                SELECT stats_updated_at 
                FROM users 
                WHERE email = $1
            `, [userEmail]);
            
            if (!user || !user.stats_updated_at) {
                return true;
            }
            
            const lastUpdated = new Date(user.stats_updated_at);
            const now = new Date();
            const diffMinutes = (now - lastUpdated) / (1000 * 60);
            
            return diffMinutes > 5;
        } catch (error) {
            console.error('检查统计更新时间失败:', error);
            return true;
        }
    }

    async updateUserNickname(userId, nickname) {
        try {
            const result = await this.run(
                'UPDATE users SET nickname = $1 WHERE id = $2',
                [nickname, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async updateUserStatus(userId, status) {
        try {
            const result = await this.run(
                'UPDATE users SET status = $1 WHERE id = $2',
                [status, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async updateUserRole(userId, role) {
        try {
            const result = await this.run(
                'UPDATE users SET role = $1 WHERE id = $2',
                [role, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async verifyPassword(userId, password) {
        try {
            const user = await this.get('SELECT password FROM users WHERE id = $1', [userId]);
            
            if (!user || !user.password) {
                return false;
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
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, userId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async hasPassword(userId) {
        try {
            const user = await this.get('SELECT password FROM users WHERE id = $1', [userId]);
            return user && user.password !== null;
        } catch (error) {
            throw error;
        }
    }

    async findUserByEmail(email) {
        try {
            return await this.get('SELECT * FROM users WHERE email = $1', [email]);
        } catch (error) {
            throw error;
        }
    }

    async upgradeToManager(userEmail, password) {
        try {
            const isManagerEmail = userEmail.toLowerCase().includes('jing');
            
            if (!isManagerEmail && password !== 'newpassword2024') {
                throw new Error('升级密码错误');
            }
            
            let user = await this.findUserByEmail(userEmail);
            if (!user) {
                const username = isManagerEmail ? 'Jing店长' : '店长用户';
                console.log(`用户 ${userEmail} 不存在，创建新用户`);
                await this.createUserByEmail(userEmail, username);
                user = await this.findUserByEmail(userEmail);
            }
            
            if (user.role === 'manager') {
                console.log(`用户 ${userEmail} 已经是店长`);
                return true;
            }
            
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
            await this.run('UPDATE users SET role = $1 WHERE email = $2', [role, email]);
        } catch (error) {
            throw error;
        }
    }

    async createUserByEmail(email, username, password = null) {
        try {
            const isManagerEmail = email.toLowerCase().includes('jing');
            const role = isManagerEmail ? 'manager' : 'user';
            
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
            
            const result = await this.query(
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
            await this.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1', [email]);
        } catch (error) {
            throw error;
        }
    }

    async saveVerificationCode(email, code, expiresAt) {
        try {
            await this.run(
                'UPDATE verification_codes SET used = true WHERE email = $1 AND used = false',
                [email]
            );

            const result = await this.query(
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
                WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            `;
            
            return await this.get(query, [email, code]);
        } catch (error) {
            throw error;
        }
    }

    async markVerificationCodeAsUsed(id) {
        try {
            await this.run('UPDATE verification_codes SET used = true WHERE id = $1', [id]);
        } catch (error) {
            throw error;
        }
    }

    async cleanExpiredCodes() {
        try {
            await this.run('DELETE FROM verification_codes WHERE expires_at < NOW()');
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
            
            return await this.get(query, [email]);
        } catch (error) {
            throw error;
        }
    }

    // 商品相关方法
    async getAllProducts() {
        try {
            return await this.all('SELECT * FROM products ORDER BY is_hot DESC, hot_priority DESC, created_at DESC');
        } catch (error) {
            throw error;
        }
    }

    async getProductById(id) {
        try {
            return await this.get('SELECT * FROM products WHERE id = $1', [id]);
        } catch (error) {
            throw error;
        }
    }

    async createProduct(name, description, price, imageUrl, category, stock, hasSweetness = false, hasIceLevel = false) {
        try {
            const result = await this.query(
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
            await this.run('DELETE FROM orders');
            await this.run('DELETE FROM products');
            console.log('清理旧商品数据完成');
        } catch (error) {
            throw error;
        }
    }

    async initSampleProducts() {
        console.log('示例商品数据已通过SQL脚本初始化');
        return true;
    }

    async updateProduct(id, name, description, price, imageUrl, category, stock, hasSweetness = false, hasIceLevel = false) {
        try {
            const result = await this.run(
                'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6, has_sweetness = $7, has_ice_level = $8 WHERE id = $9',
                [name, description, price, imageUrl, category, stock, hasSweetness, hasIceLevel, id]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async updateProductStock(id, newStock) {
        try {
            const result = await this.run(
                'UPDATE products SET stock = $1 WHERE id = $2',
                [newStock, id]
            );
            return { changes: result.changes, newStock: newStock };
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const result = await this.run('DELETE FROM products WHERE id = $1', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 订单相关方法
    async createOrder(productId, productName, productImage, quantity, price, totalPrice, customization, customerEmail) {
        try {
            const result = await this.query(
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
            const orders = await this.all('SELECT * FROM orders ORDER BY created_at DESC');
            return orders.map(order => ({
                ...order,
                customization: order.customization || null
            }));
        } catch (error) {
            throw error;
        }
    }

    async getUnreadOrdersCount() {
        try {
            const result = await this.get('SELECT COUNT(*) as count FROM orders WHERE is_read = false');
            return parseInt(result.count);
        } catch (error) {
            throw error;
        }
    }

    async markOrderAsRead(orderId) {
        try {
            const result = await this.run('UPDATE orders SET is_read = true WHERE id = $1', [orderId]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async markAllOrdersAsRead() {
        try {
            const result = await this.run('UPDATE orders SET is_read = true WHERE is_read = false');
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
            return await this.get('SELECT * FROM categories WHERE id = $1', [id]);
        } catch (error) {
            throw error;
        }
    }

    async createCategory(name, emoji = '📦') {
        try {
            const result = await this.query(
                'INSERT INTO categories (name, emoji) VALUES ($1, $2) RETURNING id',
                [name, emoji]
            );
            return { id: result.rows[0].id, name, emoji };
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(id, name, emoji) {
        try {
            const result = await this.run(
                'UPDATE categories SET name = $1, emoji = $2 WHERE id = $3',
                [name, emoji, id]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const productsCount = await this.get(
                'SELECT COUNT(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = $1)',
                [id]
            );
            
            if (parseInt(productsCount.count) > 0) {
                throw new Error(`无法删除分类：还有 ${productsCount.count} 个商品使用此分类`);
            }
            
            const result = await this.run('DELETE FROM categories WHERE id = $1', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getCategoryUsageCount(categoryName) {
        try {
            const result = await this.get(
                'SELECT COUNT(*) as count FROM products WHERE category = $1',
                [categoryName]
            );
            return parseInt(result.count);
        } catch (error) {
            throw error;
        }
    }

    async initDefaultCategories() {
        console.log('默认分类已通过SQL脚本初始化');
        return true;
    }

    // 关闭数据库连接
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('PostgreSQL 连接池已关闭');
        }
    }
}

const database = new Database();

async function initializeDatabase() {
    try {
        await database.connect();
        console.log('PostgreSQL数据库初始化完成');
        return database;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

module.exports = { database, initializeDatabase };