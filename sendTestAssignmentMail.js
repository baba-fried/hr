// sendTestAssignmentMail.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false  // <--- Add this line
    }
});

    async function sendTestAssignmentMail(toEmail, fullName, testName, link, duration) {
        const mailOptions = {
            from: `"POSSPOLE PVT" <${process.env.EMAIL_USERNAME}>`,
            to: toEmail,
            subject: `📋 New Test Assigned: ${testName}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4A90E2;">Hi ${fullName},</h2>
                    <p>
                        We’re excited to inform you that you’ve been assigned a new test:
                    </p>
                    <ul>
                        <li><strong>Test Name:</strong> ${testName}</li>
                        <li><strong>Duration:</strong> ${duration} minutes</li>
                    </ul>
                    <p>
                        To start your test, simply click the button below:
                    </p>
                    <p style="text-align: center;">
                        <a href="${link}" 
                        style="display: inline-block; background-color: #4A90E2; color: #fff; 
                                padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                            Start Test
                        </a>
                    </p>
                    <p>
                        Best of luck!<br/>
                        <strong>POSSPOLE Team</strong>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <small style="color: #999;">
                        If you did not expect this email, please ignore it.
                    </small>
                </div>
            `
        };

    return transporter.sendMail(mailOptions);
}

module.exports = sendTestAssignmentMail;
