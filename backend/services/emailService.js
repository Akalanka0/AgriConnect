import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Send verification email
 * @param {string} to - Recipient email
 * @param {string} verificationToken - Verification token
 * @param {string} fullName - User's full name
 */
export const sendVerificationEmail = async (to, verificationToken, fullName) => {
  try {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Missing Gmail SMTP configuration. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in backend/.env');
    }
    
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
            <p>&copy; 2026 AgriConnect. All rights reserved.</p>
          </div>
        </div>
      `
    };

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
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Missing Gmail SMTP configuration. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in backend/.env');
    }
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
            <p>&copy; 2026 AgriConnect. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Test email configuration
export const testEmailService = async () => {
  try {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Missing Gmail SMTP configuration. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in backend/.env');
    }
    await transporter.verify();
    console.log('✅ Gmail SMTP service is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP configuration error:', error);
    return false;
  }
};
