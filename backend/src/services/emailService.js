const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development - use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@algouniversity.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Email sent: ${info.messageId}`);
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      logger.info(`Email sent to: ${options.to}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to AlgoUniversity Online Judge!';
  const text = `
    Welcome ${user.firstname}!
    
    Thank you for joining AlgoUniversity Online Judge platform.
    
    Your account has been created successfully. You can now:
    - Solve coding problems
    - Participate in contests
    - Track your progress
    - Compete with other programmers
    
    Happy coding!
    
    Best regards,
    AlgoUniversity Team
  `;

  const html = `
    <h2>Welcome to AlgoUniversity Online Judge!</h2>
    <p>Hi ${user.firstname},</p>
    <p>Thank you for joining our coding platform!</p>
    <p>Your account has been created successfully. You can now:</p>
    <ul>
      <li>Solve coding problems</li>
      <li>Participate in contests</li>
      <li>Track your progress</li>
      <li>Compete with other programmers</li>
    </ul>
    <p>Happy coding!</p>
    <p>Best regards,<br>AlgoUniversity Team</p>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const subject = 'Password Reset Request';
  const text = `
    Hi ${user.firstname},
    
    You have requested a password reset for your AlgoUniversity account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 10 minutes.
    
    If you did not request this, please ignore this email.
    
    Best regards,
    AlgoUniversity Team
  `;

  const html = `
    <h2>Password Reset Request</h2>
    <p>Hi ${user.firstname},</p>
    <p>You have requested a password reset for your AlgoUniversity account.</p>
    <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>This link will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br>AlgoUniversity Team</p>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

// Send email verification
const sendEmailVerification = async (user, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
  
  const subject = 'Verify Your Email Address';
  const text = `
    Hi ${user.firstname},
    
    Please verify your email address by clicking the link below:
    ${verifyUrl}
    
    This link will expire in 24 hours.
    
    Best regards,
    AlgoUniversity Team
  `;

  const html = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${user.firstname},</p>
    <p>Please verify your email address by clicking the button below:</p>
    <p><a href="${verifyUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>Best regards,<br>AlgoUniversity Team</p>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

// Send submission result notification
const sendSubmissionNotification = async (user, problem, submission) => {
  const subject = `Submission ${submission.status} - ${problem.title}`;
  const statusEmoji = submission.status === 'accepted' ? '✅' : '❌';
  
  const text = `
    Hi ${user.firstname},
    
    Your submission for problem "${problem.title}" has been evaluated.
    
    Status: ${submission.status.toUpperCase()}
    Language: ${submission.language}
    Submitted at: ${submission.createdAt}
    
    ${submission.status === 'accepted' ? 'Congratulations!' : 'Keep trying!'}
    
    View your submission: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/submissions/${submission._id}
    
    Best regards,
    AlgoUniversity Team
  `;

  const html = `
    <h2>Submission Result ${statusEmoji}</h2>
    <p>Hi ${user.firstname},</p>
    <p>Your submission for problem <strong>"${problem.title}"</strong> has been evaluated.</p>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${submission.status.toUpperCase()}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Language:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${submission.language}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Submitted:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${submission.createdAt}</td></tr>
    </table>
    <p>${submission.status === 'accepted' ? 'Congratulations! 🎉' : 'Keep trying! 💪'}</p>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/submissions/${submission._id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Submission</a></p>
    <p>Best regards,<br>AlgoUniversity Team</p>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendSubmissionNotification
};
