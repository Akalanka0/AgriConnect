import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env vars are loaded
dotenv.config({ path: path.join(__dirname, '../.env') });

const CURRENT_YEAR = new Date().getFullYear();

// Gmail SMTP — lazily-initialized singleton; connection is reused across all sends
let _transporter = null;

const getTransporter = () => {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Missing Gmail SMTP configuration. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in backend/.env');
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  return _transporter;
};

/**
 * Send verification email
 * @param {string} to - Recipient email
 * @param {string} verificationToken - Verification token
 * @param {string} fullName - User's full name
 */
export const sendVerificationEmail = async (to, verificationToken, fullName) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: to,
      subject: 'AgriConnect - Email Verification Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🌾 AgriConnect</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Agricultural Management System</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for registering with AgriConnect! To complete your registration and activate your account,
              please use the verification code below.
            </p>

            <div style="background: white; border: 2px dashed #4CAF50; padding: 20px;
                        text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
                ${verificationToken}
              </h1>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center;">
              This code will expire in 10 minutes.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>This email was sent to ${to} because you registered for an AgriConnect account.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>&copy; ${CURRENT_YEAR} AgriConnect. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${to}`);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetCode - Password reset code
 * @param {string} fullName - User's full name
 */
export const sendPasswordResetEmail = async (to, resetCode, fullName) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: to,
      subject: 'AgriConnect - Password Reset Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🔐 AgriConnect</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password for your AgriConnect account. 
              Use the verification code below to reset your password.
            </p>
            
            <div style="background: white; border: 2px dashed #ff6b6b; padding: 20px; 
                        text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #ff6b6b; margin: 0; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
                ${resetCode}
              </h1>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              This code will expire in 10 minutes.<br>
              If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>&copy; ${CURRENT_YEAR} AgriConnect. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send admin invitation email
 * @param {string} to - Recipient email
 * @param {string} fullName - New admin's name
 * @param {string} tempPassword - Temporary password
 */
export const sendAdminInvitationEmail = async (to, fullName, tempPassword) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: to,
      subject: 'AgriConnect - Admin Invitation',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #5d4037, #3e2723); padding: 30px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">👑 AgriConnect Admin</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to the Management Team</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${fullName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              You have been invited to join the AgriConnect administration team. Your account has been created
              and you can now log in using the credentials below.
            </p>

            <div style="background: white; border-left: 4px solid #5d4037; padding: 20px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>

            <p style="color: #d84315; font-size: 14px; font-weight: bold;">
              Please change your password immediately after your first login for security purposes.
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background: #5d4037; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Log In to Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>This is an automated invitation. If you were not expecting this, please contact the system administrator.</p>
            <p>&copy; ${CURRENT_YEAR} AgriConnect. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin invitation email sent to ${to}`);
    return { success: true, message: 'Admin invitation email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending admin invitation email:', error);
    throw new Error('Failed to send admin invitation email');
  }
};

// Test email configuration
export const testEmailService = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Gmail SMTP service is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP configuration error:', error);
    return false;
  }
};
