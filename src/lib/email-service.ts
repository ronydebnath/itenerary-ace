
/**
 * @fileoverview This file provides placeholder email sending utilities.
 * IMPORTANT: This is a FRONTEND placeholder. Actual email sending MUST be
 * handled by a secure backend API to protect your SendGrid API key.
 *
 * These functions simulate what would be sent to such a backend.
 */
'use server'; // This directive is for Next.js, but actual sending must be on a true backend.

import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';

let isSendGridConfigured = false;
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your_sendgrid_api_key_here' && SENDGRID_API_KEY.trim() !== '') {
  sgMail.setApiKey(SENDGRID_API_KEY);
  isSendGridConfigured = true;
} else {
  console.warn(
    "SendGrid API Key is not configured. Email sending will be simulated in console."
  );
}

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Placeholder function to "send" an email.
 * In a real app, this would call a backend API endpoint.
 * @param params - Email parameters
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
  console.log("Attempting to send email (placeholder)...");
  console.log("To:", params.to);
  console.log("From:", EMAIL_FROM);
  console.log("Subject:", params.subject);
  console.log("Text:", params.text);
  console.log("HTML:", params.html);

  if (!isSendGridConfigured) {
    const message = "SIMULATED: Email would be sent. SendGrid not configured.";
    console.warn(message);
    return { success: true, message };
  }
  
  if (!EMAIL_FROM || EMAIL_FROM === 'noreply@example.com' && !process.env.EMAIL_FROM) {
     const message = "ERROR: EMAIL_FROM environment variable is not set. Cannot send email.";
     console.error(message);
     return { success: false, message };
  }

  const msg = {
    to: params.to,
    from: EMAIL_FROM, // Use the configured sender
    subject: params.subject,
    text: params.text,
    html: params.html,
  };

  try {
    // In a real backend, you would await sgMail.send(msg);
    // For this frontend placeholder, we will just log success if configured.
    console.log("[SUCCESS - Placeholder] Email prepared for SendGrid:", msg);
    // Simulating what a backend would do:
    // await sgMail.send(msg);
    // console.log('Email successfully dispatched via SendGrid (simulated from backend call)');
    return { success: true, message: "Email request logged. In a real app, this would be sent via backend." };

  } catch (error: any) {
    console.error("SendGrid placeholder error (would be backend error):", error.response?.body || error.message);
    return { success: false, message: `Failed to prepare email for SendGrid (simulated): ${error.message}` };
  }
}

/**
 * Placeholder function to "send" a password reset email.
 * @param to - Recipient's email address
 * @param resetLink - The unique password reset link
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<{ success: boolean; message: string }> {
  const subject = "Your Password Reset Request for Itinerary Ace";
  const text = `
    Hello,

    You requested a password reset for your Itinerary Ace account.
    Please click the link below to reset your password:
    ${resetLink}

    If you did not request this, please ignore this email.

    Thanks,
    The Itinerary Ace Team
  `;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your Itinerary Ace account.</p>
      <p>Please click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="color: #3EB4EF; text-decoration: none;">Reset Your Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <br>
      <p>Thanks,</p>
      <p><strong>The Itinerary Ace Team</strong></p>
    </div>
  `;

  // IMPORTANT: The actual call to sgMail.send() should happen on your backend.
  // This function is a frontend placeholder.
  console.log(`Password Reset Email Placeholder:
    To: ${to}
    From: ${EMAIL_FROM}
    Subject: ${subject}
    Reset Link: ${resetLink}
    ---
    This would be sent to a backend endpoint which then uses SendGrid.
  `);

  // If SendGrid was configured and this was a backend:
  // return sendEmail({ to, subject, text, html });

  if (!isSendGridConfigured) {
    return { success: true, message: "SIMULATED: Password reset email would be sent. SendGrid not configured." };
  }
   if (!EMAIL_FROM || EMAIL_FROM === 'noreply@example.com' && !process.env.EMAIL_FROM) {
     const message = "ERROR: EMAIL_FROM environment variable is not set. Cannot send email.";
     console.error(message);
     return { success: false, message };
  }


  // Simulate sending via the generic sendEmail function (as a backend would orchestrate)
  return sendEmail({
      to,
      subject,
      text,
      html
  });
}
