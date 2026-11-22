// src/config/mailer.js
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * إرسال بريد إلكتروني
 * @param {Object} options - { to, subject, html, text }
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'نظام بصمة'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Email failed to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * التحقق من إعدادات البريد
 */
export async function verifyMailer() {
  try {
    const mailer = getTransporter();
    await mailer.verify();
    logger.info('✅ Mail server connection verified');
    return true;
  } catch (error) {
    logger.warn(`⚠️ Mail server not available: ${error.message}`);
    return false;
  }
}
