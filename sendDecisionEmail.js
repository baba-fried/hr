const nodemailer = require('nodemailer');

// Email templates
const emailTemplates = {
    accepted: {
        subject: 'Congratulations! Your Application Has Been Accepted - Posspole',
        html: (userName, testName, notes) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiSbNPeeRTHFUZutq4tYlHQBPnb-A92JdFCw&s" alt="Posspole Logo" style="height: 60px;">
                </div>
                <h2 style="color: #22c55e; margin-bottom: 20px;">🎉 Congratulations, ${userName}!</h2>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    We are delighted to inform you that your application for the <strong>${testName}</strong> position has been <strong>ACCEPTED</strong>!
                </p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">What's Next?</h3>
                    <ul style="color: #166534; line-height: 1.8;">
                        <li>Our HR team will contact you within 2-3 business days</li>
                        <li>You'll receive details about the next steps in the hiring process</li>
                        <li>Please keep your contact information updated</li>
                    </ul>
                </div>
                ${notes ? `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                    <h4 style="color: #92400e; margin-top: 0;">Additional Notes:</h4>
                    <p style="color: #92400e; margin-bottom: 0;">${notes}</p>
                </div>
                ` : ''}
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Your performance in the assessment was impressive, and we believe you would be a great addition to our team.
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    If you have any questions, please don't hesitate to reach out to us at <a href="mailto:posspole.com" style="color: #3b82f6;">admin@posspole.com</a>
                </p>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">
                        Best regards,<br>
                        The Posspole HR Team
                    </p>
                </div>
            </div>
        `
    },
    rejected: {
        subject: 'Application Status Update - Posspole',
        html: (userName, testName, notes) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiSbNPeeRTHFUZutq4tYlHQBPnb-A92JdFCw&s" alt="Posspole Logo" style="height: 60px;">
                </div>
                <h2 style="color: #374151; margin-bottom: 20px;">Application Status Update</h2>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Dear ${userName},
                </p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Thank you for your interest in the <strong>${testName}</strong> position and for taking the time to complete our assessment process.
                </p>
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #991b1b; margin-top: 0;">Application Status</h3>
                    <p style="color: #991b1b; margin-bottom: 0;">
                        After careful consideration, we regret to inform you that we are unable to move forward with your application at this time.
                    </p>
                </div>
                ${notes ? `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                    <h4 style="color: #92400e; margin-top: 0;">Feedback:</h4>
                    <p style="color: #92400e; margin-bottom: 0;">${notes}</p>
                </div>
                ` : ''}
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    We appreciate your interest in joining our team and encourage you to apply for future opportunities that match your skills and experience.
                </p>
                <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                    <h4 style="color: #1e40af; margin-top: 0;">Keep in Touch</h4>
                    <p style="color: #1e40af; margin-bottom: 0;">
                        We'll keep your resume on file and may reach out for future opportunities that align with your profile.
                    </p>
                </div>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    We wish you the best in your future endeavors.
                </p>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">
                        Best regards,<br>
                        The Posspole HR Team
                    </p>
                </div>
            </div>
        `
    }
};

async function sendDecisionEmail(userEmail, userName, testName, decision, notes = '') {
    try {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('📧 Email credentials not configured. Simulating email send...');
            console.log('📧 Would send email to:', userEmail);
            console.log('📧 Subject:', emailTemplates[decision]?.subject);
            console.log('📧 Decision:', decision);
            console.log('📧 Notes:', notes);
            return { messageId: 'simulated-email-id' };
        }

        // Create transporter (you'll need to configure this with your email service)
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or your email service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const template = emailTemplates[decision];
        if (!template) {
            throw new Error(`Invalid decision type: ${decision}`);
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html(userName, testName, notes)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Decision email sent successfully:', info.messageId);
        return info;

    } catch (error) {
        console.error('Error sending decision email:', error);
        throw error;
    }
}

module.exports = sendDecisionEmail;
