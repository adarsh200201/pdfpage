const nodemailer = require("nodemailer");

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName = "User") => {
  try {
    console.log("📧 [EMAIL] Preparing to send OTP to:", email);

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();
    console.log("✅ [EMAIL] SMTP connection verified");

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "PdfPage"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset - Your Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 40px 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    margin-top: 40px;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo h1 {
                    color: #dc2626;
                    font-size: 28px;
                    font-weight: bold;
                    margin: 0;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .otp-code {
                    background-color: #f8f9fa;
                    border: 2px dashed #dc2626;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }
                .otp-code h2 {
                    font-size: 36px;
                    color: #dc2626;
                    margin: 0;
                    letter-spacing: 4px;
                    font-weight: bold;
                }
                .content {
                    color: #374151;
                    line-height: 1.8;
                }
                .warning {
                    background-color: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }
                .button {
                    display: inline-block;
                    background-color: #dc2626;
                    color: white !important;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>📄 PdfPage</h1>
                </div>
                
                <div class="header">
                    <h2 style="color: #1f2937; margin: 0;">Password Reset Request</h2>
                </div>
                
                <div class="content">
                    <p>Hello ${userName},</p>
                    
                    <p>We received a request to reset your password for your PdfPage account. Use the verification code below to proceed with resetting your password:</p>
                    
                    <div class="otp-code">
                        <h2>${otp}</h2>
                        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                            This code will expire in <strong>5 minutes</strong>
                        </p>
                    </div>
                    
                    <p>Enter this code on the password reset page to continue. If you didn't request a password reset, you can safely ignore this email.</p>
                    
                    <div class="warning">
                        <strong>🔒 Security Notice:</strong> Never share this code with anyone. PdfPage support will never ask for your verification code.
                    </div>
                </div>
                
                <div class="footer">
                    <p>This email was sent by PdfPage - The Ultimate PDF Toolkit</p>
                    <p>If you didn't request this password reset, please contact our support team.</p>
                    <p style="margin-top: 20px;">
                        <strong>Need help?</strong> Visit our <a href="#" style="color: #dc2626;">Help Center</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
        Password Reset - PdfPage
        
        Hello ${userName},
        
        We received a request to reset your password for your PdfPage account.
        
        Your verification code is: ${otp}
        
        This code will expire in 5 minutes.
        
        Enter this code on the password reset page to continue. If you didn't request a password reset, you can safely ignore this email.
        
        Security Notice: Never share this code with anyone. PdfPage support will never ask for your verification code.
        
        ---
        This email was sent by PdfPage - The Ultimate PDF Toolkit
        If you didn't request this password reset, please contact our support team.
      `,
    };

    console.log("📤 [EMAIL] Sending OTP email...");
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ [EMAIL] OTP email sent successfully:");
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", info.response);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("🔴 [EMAIL] Failed to send OTP email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email, userName = "User") => {
  try {
    console.log("📧 [EMAIL] Sending password reset confirmation to:", email);

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "PdfPage"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Successful - PdfPage",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 40px 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    margin-top: 40px;
                }
                .success-icon {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .success-icon div {
                    width: 80px;
                    height: 80px;
                    background-color: #10b981;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                }
                .content {
                    color: #374151;
                    line-height: 1.8;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">
                    <div>✅</div>
                </div>
                
                <div class="content">
                    <h2 style="color: #1f2937;">Password Reset Successful!</h2>
                    
                    <p>Hello ${userName},</p>
                    
                    <p>Your password has been successfully reset for your PdfPage account. You can now log in with your new password.</p>
                    
                    <p>If you didn't make this change, please contact our support team immediately.</p>
                    
                    <p style="margin-top: 40px;">
                        <strong>Thank you for using PdfPage!</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [EMAIL] Password reset confirmation sent successfully");

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("🔴 [EMAIL] Failed to send confirmation email:", error);
    // Don't throw error here, as password reset was successful
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetConfirmation,
};
