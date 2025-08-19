// 测试前端生成的店长令牌格式
const payload = {
    userId: Date.now(),
    email: 'jing19751013@icloud.com',
    role: 'manager',
    iat: Math.floor(Date.now() / 1000)
};

// 模拟前端生成的令牌格式
const header = Buffer.from(JSON.stringify({alg: "HS256", typ: "JWT"})).toString('base64');
const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
const signature = Buffer.from("manager-token-signature").toString('base64');
const token = `${header}.${payloadStr}.${signature}`;

console.log('测试店长Token:', token);

// 测试用户管理API
const testAPI = async () => {
    try {
        const fetch = (await import('node-fetch')).default;
        
        console.log('\n=== 测试用户管理API ===');
        
        const response = await fetch('http://localhost:3000/api/products/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.text();
        console.log('响应状态:', response.status);
        console.log('响应内容:', result);
        
    } catch (error) {
        console.error('测试失败:', error);
    }
};

testAPI();