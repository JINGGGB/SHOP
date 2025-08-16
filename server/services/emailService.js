const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendVerificationCode(email, code) {
        try {
            const mailOptions = {
                from: `"登录系统" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '您的登录验证码',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333; text-align: center;">登录验证码</h2>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="font-size: 16px; color: #666; margin-bottom: 10px;">您好，</p>
                            <p style="font-size: 16px; color: #666; margin-bottom: 20px;">您的登录验证码是：</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; 
                                           background-color: #e3f2fd; padding: 15px 30px; border-radius: 8px; display: inline-block;">
                                    ${code}
                                </span>
                            </div>
                            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                                • 此验证码5分钟内有效，请勿泄露给他人
                            </p>
                            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                                • 如非本人操作，请忽略此邮件
                            </p>
                        </div>
                        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
                            此邮件由系统自动发送，请勿回复
                        </p>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('邮件发送成功:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('邮件发送失败:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyEmailConfig() {
        try {
            await this.transporter.verify();
            console.log('邮件服务配置验证成功');
            return true;
        } catch (error) {
            console.error('邮件服务配置验证失败:', error);
            return false;
        }
    }
}

module.exports = new EmailService();