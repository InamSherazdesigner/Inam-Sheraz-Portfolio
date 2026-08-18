import nodemailer from 'nodemailer';
import { Message } from './message.model.js';
import { hashClient } from '../../lib/hash.js';
import { isDatabaseConnected } from '../../config/database.js';
import { env } from '../../config/env.js';

let mailTransporter = null;

function getMailTransporter() {
  if (mailTransporter) return mailTransporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else if (env.SMTP_USER && env.SMTP_PASS) {
    // Default to Gmail service
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return mailTransporter;
}

/**
 * Sends notification email to inamsherazdesigner@gmail.com
 */
async function sendNotificationEmail({ input, ctx }) {
  const receiverEmail = env.CONTACT_RECEIVER_EMAIL || 'inamsherazdesigner@gmail.com';
  const subjectLine = input.subject?.trim()
    ? `[Portfolio Contact] ${input.subject.trim()} (from ${input.name})`
    : `[Portfolio Contact] New message from ${input.name}`;

  const textBody = `You received a new message from your Portfolio Contact Form:

Name: ${input.name}
Email: ${input.email}
Subject: ${input.subject || '(No subject)'}

Message:
${input.body}

---
Sent via Inam Sheraz Portfolio Website (Request ID: ${ctx.requestId})`;

  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #FFA827; margin-top: 0;">New Message from Portfolio Website</h2>
  <p><strong>Name:</strong> ${input.name}</p>
  <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
  <p><strong>Subject:</strong> ${input.subject || '—'}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
  <p><strong>Message:</strong></p>
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-size: 15px; color: #333;">${input.body}</div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
  <p style="font-size: 12px; color: #888;">Reply directly to this email to answer ${input.name} (${input.email}).</p>
</div>`;

  // 1. Try Resend if configured
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Contact <onboarding@resend.dev>',
          to: [receiverEmail],
          reply_to: input.email,
          subject: subjectLine,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        ctx.log.info({ receiverEmail }, 'Email dispatched via Resend');
        return true;
      }
    } catch (err) {
      ctx.log.warn({ err }, 'Failed to dispatch via Resend');
    }
  }

  // 2. Try SMTP / Gmail Transporter
  const transporter = getMailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${input.name} via Portfolio" <${env.SMTP_USER || receiverEmail}>`,
        to: receiverEmail,
        replyTo: input.email,
        subject: subjectLine,
        text: textBody,
        html: htmlBody,
      });
      ctx.log.info({ receiverEmail }, 'Email dispatched via SMTP');
      return true;
    } catch (err) {
      ctx.log.warn({ err }, 'Failed to dispatch via SMTP');
    }
  }

  ctx.log.info({ receiverEmail, sender: input.email }, 'Email logged (SMTP credentials not yet configured in .env)');
  return false;
}

/**
 * @returns {Promise<{ accepted: boolean, id: string|null }>}
 */
export async function submitMessage({ input, ctx }) {
  // Honeypot tripped.
  if (input.website) {
    ctx.log.info({ reason: 'honeypot' }, 'contact submission discarded');
    return { accepted: true, id: null };
  }

  let messageId = null;

  // 1. Save to Database if connected
  if (isDatabaseConnected()) {
    try {
      const message = await Message.create({
        name: input.name,
        email: input.email,
        subject: input.subject,
        body: input.body,
        requestId: ctx.requestId,
        clientHash: hashClient(ctx.ip),
      });
      messageId = message.id;
      ctx.log.info({ messageId }, 'contact message stored in database');
    } catch (dbErr) {
      ctx.log.warn({ dbErr }, 'Could not store message in database');
    }
  }

  // 2. Dispatch Email
  await sendNotificationEmail({ input, ctx });

  return { accepted: true, id: messageId || 'msg_' + Date.now() };
}

