const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// SQLite数据库路径
const sqliteDbPath = path.join(__dirname, 'server', 'database', 'app.db');

// PostgreSQL连接配置
const pgConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'tea_shop',
    user: process.env.DB_USER || 'tea_shop_user',
    password: process.env.DB_PASSWORD,
};

async function migrateData() {
    let sqliteDb = null;
    let pgPool = null;

    try {
        console.log('开始数据迁移...');

        // 连接SQLite数据库
        sqliteDb = new sqlite3.Database(sqliteDbPath, (err) => {
            if (err) {
                console.error('SQLite连接失败:', err);
                throw err;
            }
            console.log('SQLite数据库连接成功');
        });

        // 连接PostgreSQL数据库
        pgPool = new Pool(pgConfig);
        console.log('PostgreSQL数据库连接成功');

        // 迁移用户数据
        console.log('迁移用户数据...');
        await migrateUsers(sqliteDb, pgPool);

        // 迁移分类数据
        console.log('迁移分类数据...');
        await migrateCategories(sqliteDb, pgPool);

        // 迁移商品数据
        console.log('迁移商品数据...');
        await migrateProducts(sqliteDb, pgPool);

        // 迁移订单数据
        console.log('迁移订单数据...');
        await migrateOrders(sqliteDb, pgPool);

        // 迁移验证码数据
        console.log('迁移验证码数据...');
        await migrateVerificationCodes(sqliteDb, pgPool);

        console.log('数据迁移完成！');

    } catch (error) {
        console.error('数据迁移失败:', error);
    } finally {
        // 关闭连接
        if (sqliteDb) {
            sqliteDb.close();
        }
        if (pgPool) {
            await pgPool.end();
        }
    }
}

function sqliteQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function migrateUsers(sqliteDb, pgPool) {
    try {
        const users = await sqliteQuery(sqliteDb, 'SELECT * FROM users');
        
        if (users.length === 0) {
            console.log('没有找到用户数据');
            return;
        }

        for (const user of users) {
            try {
                await pgPool.query(
                    `INSERT INTO users (id, phone, email, username, password, avatar, role, nickname, status, total_orders, total_spent, created_at, last_login, stats_updated_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                     ON CONFLICT (email) DO UPDATE SET
                     phone = EXCLUDED.phone,
                     username = EXCLUDED.username,
                     password = EXCLUDED.password,
                     avatar = EXCLUDED.avatar,
                     role = EXCLUDED.role,
                     nickname = EXCLUDED.nickname,
                     status = EXCLUDED.status,
                     total_orders = EXCLUDED.total_orders,
                     total_spent = EXCLUDED.total_spent,
                     last_login = EXCLUDED.last_login,
                     stats_updated_at = EXCLUDED.stats_updated_at`,
                    [
                        user.id,
                        user.phone,
                        user.email,
                        user.username,
                        user.password,
                        user.avatar,
                        user.role,
                        user.nickname,
                        user.status || 'active',
                        user.total_orders || 0,
                        user.total_spent || 0,
                        user.created_at,
                        user.last_login,
                        user.stats_updated_at
                    ]
                );
                console.log(`用户 ${user.username} 迁移成功`);
            } catch (error) {
                console.error(`用户 ${user.username} 迁移失败:`, error.message);
            }
        }

        // 更新序列
        await pgPool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
        
    } catch (error) {
        console.error('迁移用户数据失败:', error);
    }
}

async function migrateCategories(sqliteDb, pgPool) {
    try {
        const categories = await sqliteQuery(sqliteDb, 'SELECT * FROM categories');
        
        if (categories.length === 0) {
            console.log('没有找到分类数据');
            return;
        }

        for (const category of categories) {
            try {
                await pgPool.query(
                    `INSERT INTO categories (id, name, emoji, created_at) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (name) DO UPDATE SET
                     emoji = EXCLUDED.emoji,
                     created_at = EXCLUDED.created_at`,
                    [category.id, category.name, category.emoji, category.created_at]
                );
                console.log(`分类 ${category.name} 迁移成功`);
            } catch (error) {
                console.error(`分类 ${category.name} 迁移失败:`, error.message);
            }
        }

        // 更新序列
        await pgPool.query("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))");
        
    } catch (error) {
        console.error('迁移分类数据失败:', error);
    }
}

async function migrateProducts(sqliteDb, pgPool) {
    try {
        const products = await sqliteQuery(sqliteDb, 'SELECT * FROM products');

        if (products.length === 0) {
            console.log('没有找到商品数据');
            return;
        }

        for (const product of products) {
            try {
                await pgPool.query(
                    `INSERT INTO products (id, name, description, price, discount_price, discount_percentage, image_url, category, stock, is_hot, hot_priority, hot_badge_text, has_sweetness, has_ice_level, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                     ON CONFLICT (id) DO UPDATE SET
                     name = EXCLUDED.name,
                     description = EXCLUDED.description,
                     price = EXCLUDED.price,
                     discount_price = EXCLUDED.discount_price,
                     discount_percentage = EXCLUDED.discount_percentage,
                     image_url = EXCLUDED.image_url,
                     category = EXCLUDED.category,
                     stock = EXCLUDED.stock,
                     is_hot = EXCLUDED.is_hot,
                     hot_priority = EXCLUDED.hot_priority,
                     hot_badge_text = EXCLUDED.hot_badge_text,
                     has_sweetness = EXCLUDED.has_sweetness,
                     has_ice_level = EXCLUDED.has_ice_level`,
                    [
                        product.id,
                        product.name,
                        product.description,
                        product.price,
                        product.discount_price || null,
                        product.discount_percentage || null,
                        product.image_url,
                        product.category,
                        product.stock,
                        product.is_hot === 1,
                        product.hot_priority || 0,
                        product.hot_badge_text || null,
                        product.has_sweetness === 1,
                        product.has_ice_level === 1,
                        product.created_at
                    ]
                );
                console.log(`商品 ${product.name} 迁移成功`);
            } catch (error) {
                console.error(`商品 ${product.name} 迁移失败:`, error.message);
            }
        }

        // 更新序列
        await pgPool.query("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))");

    } catch (error) {
        console.error('迁移商品数据失败:', error);
    }
}

async function migrateOrders(sqliteDb, pgPool) {
    try {
        const orders = await sqliteQuery(sqliteDb, 'SELECT * FROM orders');
        
        if (orders.length === 0) {
            console.log('没有找到订单数据');
            return;
        }

        for (const order of orders) {
            try {
                // 解析customization JSON
                let customization = null;
                if (order.customization) {
                    try {
                        customization = JSON.parse(order.customization);
                    } catch (e) {
                        customization = order.customization;
                    }
                }

                await pgPool.query(
                    `INSERT INTO orders (id, product_id, product_name, product_image, quantity, price, total_price, customization, customer_email, status, is_read, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        order.id,
                        order.product_id,
                        order.product_name,
                        order.product_image,
                        order.quantity,
                        order.price,
                        order.total_price,
                        JSON.stringify(customization),
                        order.customer_email,
                        order.status,
                        order.is_read === 1,
                        order.created_at
                    ]
                );
                console.log(`订单 ${order.id} 迁移成功`);
            } catch (error) {
                console.error(`订单 ${order.id} 迁移失败:`, error.message);
            }
        }

        // 更新序列
        await pgPool.query("SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders))");
        
    } catch (error) {
        console.error('迁移订单数据失败:', error);
    }
}

async function migrateVerificationCodes(sqliteDb, pgPool) {
    try {
        const codes = await sqliteQuery(sqliteDb, 'SELECT * FROM verification_codes');
        
        if (codes.length === 0) {
            console.log('没有找到验证码数据');
            return;
        }

        for (const code of codes) {
            try {
                await pgPool.query(
                    `INSERT INTO verification_codes (id, email, code, expires_at, used, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        code.id,
                        code.email,
                        code.code,
                        code.expires_at,
                        code.used === 1,
                        code.created_at
                    ]
                );
                console.log(`验证码 ${code.id} 迁移成功`);
            } catch (error) {
                console.error(`验证码 ${code.id} 迁移失败:`, error.message);
            }
        }

        // 更新序列
        await pgPool.query("SELECT setval('verification_codes_id_seq', (SELECT MAX(id) FROM verification_codes))");
        
    } catch (error) {
        console.error('迁移验证码数据失败:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    migrateData();
}

module.exports = { migrateData };