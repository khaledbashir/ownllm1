const { SystemSettings } = require("../models/systemSettings");

/**
 * Email Service Utility
 * Handles sending emails for verification, notifications, etc.
 * 
 * Uses environment variables or system settings for SMTP configuration.
 * If not configured, emails will be logged to console instead.
 */

class EmailService {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  /**
   * Initialize the email service with configuration
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Check if SMTP is configured in system settings
      const settings = await SystemSettings.currentSettings();
      
      this.config = {
        host: process.env.SMTP_HOST || null,
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || null,
        password: process.env.SMTP_PASSWORD || null,
        from: process.env.SMTP_FROM || process.env.DEFAULT_EMAIL_SENDER || "noreply@ownllm.com",
        secure: process.env.SMTP_SECURE === "true",
      };

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize email service:", error.message);
    }
  }

  /**
   * Check if email service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.config?.host && this.config?.user && this.config?.password);
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async send({ to, subject, text, html }) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Log email if not configured
    if (!this.isConfigured()) {
      console.log("=".repeat(60));
      console.log("EMAIL SERVICE NOT CONFIGURED - EMAIL LOGGED TO CONSOLE");
      console.log("=".repeat(60));
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("Content:");
      console.log(text || html);
      console.log("=".repeat(60));
      return { success: true, error: null, sent: false };
    }

    try {
      const nodemailer = require("nodemailer");
      
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      });

      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        text,
        html,
      };

      await transporter.sendMail(mailOptions);
      return { success: true, error: null, sent: true };
    } catch (error) {
      console.error("Failed to send email:", error.message);
      return { success: false, error: error.message, sent: false };
    }
  }

  /**
   * Send email verification email
   * @param {Object} options - Verification options
   * @param {string} options.to - Recipient email
   * @param {string} options.token - Verification token
   * @param {string} options.username - User's username
   * @param {string} options.appUrl - Base URL of the application
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async sendVerificationEmail({ to, token, username, appUrl }) {
    const verificationUrl = `${appUrl || ""}/verify-email?token=${token}`;
    const appTitle = process.env.APP_NAME || "AnythingLLM";

    const text = `
Hello ${username || there},

Thank you for registering with ${appTitle}!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you did not create an account with ${appTitle}, please ignore this email.

Best regards,
The ${appTitle} Team
`.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
    <h2 style="color: #333; margin-top: 0;">Verify your email address</h2>
    <p>Hello ${username || there},</p>
    <p>Thank you for registering with <strong>${appTitle}</strong>!</p>
    <p>Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    </div>
    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #666;">${verificationUrl}</p>
    <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
    <p style="font-size: 14px; color: #666;">If you did not create an account with ${appTitle}, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #999;">Best regards,<br>The ${appTitle} Team</p>
  </div>
</body>
</html>
`.trim();

    return this.send({
      to,
      subject: `Verify your email address - ${appTitle}`,
      text,
      html,
    });
  }

  /**
   * Send welcome email after verification
   * @param {Object} options - Welcome options
   * @param {string} options.to - Recipient email
   * @param {string} options.username - User's username
   * @param {string} options.organizationName - Organization name
   * @param {string} options.appUrl - Base URL of the application
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async sendWelcomeEmail({ to, username, organizationName, appUrl }) {
    const appTitle = process.env.APP_NAME || "AnythingLLM";
    const loginUrl = `${appUrl || ""}/login`;

    const text = `
Hello ${username},

Welcome to ${appTitle}!

Your email has been verified successfully. You are now a member of the "${organizationName}" organization.

You can now log in to your account:
${loginUrl}

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The ${appTitle} Team
`.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${appTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
    <h2 style="color: #333; margin-top: 0;">Welcome to ${appTitle}!</h2>
    <p>Hello ${username},</p>
    <p>Your email has been verified successfully. You are now a member of the <strong>${organizationName}</strong> organization.</p>
    <p>You can now log in to your account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In</a>
    </div>
    <p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to contact our support team.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #999;">Best regards,<br>The ${appTitle} Team</p>
  </div>
</body>
</html>
`.trim();

    return this.send({
      to,
      subject: `Welcome to ${appTitle}!`,
      text,
      html,
    });
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = { EmailService: emailService };
