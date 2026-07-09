const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
    // If SMTP details aren't provided, log to console (DEV MODE)
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log(`\n================================`);
        console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
        console.log(`================================\n`);
        return true;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"Audio Tweet App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your Audio Tweet verification code",
            text: `Your verification code is: ${otp}\nThis code expires in 5 minutes.\nIf you didn't request this, ignore this email.`,
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2>Your Audio Tweet verification code</h2>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 20px; background: #f4f4f5; display: inline-block; border-radius: 8px;">
                        ${otp}
                    </div>
                    <p style="color: #666; margin-top: 20px;">This code expires in 5 minutes.</p>
                    <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
                </div>
            `,
        });

        console.log(`Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendOtpEmail
};
