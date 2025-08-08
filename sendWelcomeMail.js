require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendWelcomeMail(email, fullName) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[WELCOME MAIL ERROR] EMAIL_USER or EMAIL_PASS not set in .env');
        throw new Error('Email credentials not set');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // HTML template with logo and styling
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiSbNPeeRTHFUZutq4tYlHQBPnb-A92JdFCw&s" alt="Posspole Logo" style="height: 60px;">
                </div>
                <h2 style="color: #2563eb;">Welcome to Posspole, ${fullName}!</h2>
                <p style="font-size: 16px; line-height: 1.6;">
                    Thank you for registering with <b>Posspole</b>! 🎉<br>
                    We’re thrilled to have you on board.<br><br>
                    You can now access your dashboard, take exams, and track your progress.
                </p>
                <div style="margin: 32px 0;">
                    <a href="https://posspole.com" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Visit Posspole</a>
                </div>
                <p style="font-size: 15px; color: #555;">
                    If you have any questions, reply to this email or contact us at <a href="mailto:admin@posspole.com">admin@posspole.com</a>.
                </p>
                <div style="margin-top: 40px; color: #888; font-size: 13px; text-align: center;">
                    Best regards,<br>
                    The Posspole Team
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"POSSPOLE PVT" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Posspole! 🎉',
            text: `Hi ${fullName},\n\nThank you for registering with Posspole! We're thrilled to have you on board.\n\nVisit https://posspole.com\n\nBest regards,\nThe Posspole Team`,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[WELCOME MAIL SENT] to ${email}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[WELCOME MAIL ERROR] to ${email}:`, error);
        throw new Error('Failed to send welcome mail: ' + error.message);
    }
}

module.exports = sendWelcomeMail;
