import { createTransporter } from '../config/mailer.js';

// Sends transactional emails like signup and order confirmation.
export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[MAILER_DISABLED] To: ${to} | Subject: ${subject}`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
};
