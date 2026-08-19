import { NextResponse } from 'next/server';

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  body?: string;
  website?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RECEIVER_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || 'inamsherazdesigner@gmail.com';
const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY || '6bf3ef88-c539-4b58-86ea-9d5a74087ee6';

async function dispatchEmail(input: {
  name: string;
  email: string;
  subject?: string;
  body: string;
}) {
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
Sent via Inam Sheraz Portfolio (https://inam-sheraz-portfolio.vercel.app)`;

  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #FFA827; border-radius: 8px; background-color: #0d0d0d; color: #FFA827;">
  <h2 style="color: #FFA827; margin-top: 0; border-bottom: 1px solid rgba(255, 168, 39, 0.3); padding-bottom: 8px;">New Message from Portfolio Website</h2>
  <p><strong style="color: #ffffff;">Name:</strong> ${input.name}</p>
  <p><strong style="color: #ffffff;">Email:</strong> <a href="mailto:${input.email}" style="color: #FFA827;">${input.email}</a></p>
  <p><strong style="color: #ffffff;">Subject:</strong> ${input.subject || '—'}</p>
  <div style="margin: 16px 0; padding: 16px; background-color: #1a1a1a; border-left: 3px solid #FFA827; border-radius: 4px; white-space: pre-wrap; font-size: 14px; color: #f0f0f0;">${input.body}</div>
  <p style="font-size: 12px; color: #888888; margin-top: 20px;">Reply directly to this email to answer ${input.name} (${input.email}).</p>
</div>`;

  let sent = false;

  // 1. Try Resend API if configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Contact <onboarding@resend.dev>',
          to: [RECEIVER_EMAIL],
          reply_to: input.email,
          subject: subjectLine,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        console.log(`[Contact API] Email dispatched via Resend to ${RECEIVER_EMAIL}`);
        sent = true;
      }
    } catch (err) {
      console.error('[Contact API] Resend failure:', err);
    }
  }

  // 2. Try FormSubmit API (Reliable serverless webhook)
  if (!sent) {
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${RECEIVER_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://inam-sheraz-portfolio.vercel.app',
          Referer: 'https://inam-sheraz-portfolio.vercel.app/',
        },
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          _subject: subjectLine,
          message: input.body,
          _template: 'table',
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success !== 'false') {
          console.log(`[Contact API] Email dispatched via FormSubmit to ${RECEIVER_EMAIL}`);
          sent = true;
        }
      }
    } catch (err) {
      console.error('[Contact API] FormSubmit failure:', err);
    }
  }

  // 3. Try Web3Forms API
  if (!sent && WEB3FORMS_KEY) {
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: input.name,
          email: input.email,
          subject: subjectLine,
          message: input.body,
          from_name: 'Inam Sheraz Portfolio',
        }),
      });

      if (res.ok) {
        console.log(`[Contact API] Email dispatched via Web3Forms to ${RECEIVER_EMAIL}`);
        sent = true;
      }
    } catch (err) {
      console.error('[Contact API] Web3Forms failure:', err);
    }
  }

  // 4. Try Nodemailer / SMTP if configured
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!sent && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${input.name} via Portfolio" <${smtpUser}>`,
        to: RECEIVER_EMAIL,
        replyTo: input.email,
        subject: subjectLine,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[Contact API] Email dispatched via Gmail SMTP to ${RECEIVER_EMAIL}`);
      sent = true;
    } catch (err) {
      console.error('[Contact API] SMTP failure:', err);
    }
  }

  console.log(`[Contact API] Message recorded for ${RECEIVER_EMAIL} from ${input.name} <${input.email}> (Dispatched: ${sent})`);
  return sent;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ContactRequestBody;

    // Honeypot spam trap
    if (body.website) {
      return NextResponse.json({
        ok: true,
        data: {
          accepted: true,
          message: 'Message sent! Thanks for reaching out.',
        },
      });
    }

    const name = body.name?.trim() || '';
    const email = body.email?.trim() || '';
    const subject = body.subject?.trim() || '';
    const messageText = body.body?.trim() || '';

    const details: Array<{ field: string; message: string }> = [];

    if (!name) {
      details.push({ field: 'name', message: 'Please add your name.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      details.push({ field: 'email', message: 'That does not look like an email address.' });
    }
    if (messageText.length < 10) {
      details.push({ field: 'body', message: 'Please write a little more than that (minimum 10 characters).' });
    }

    if (details.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Please check the form fields and try again.',
            details,
          },
        },
        { status: 400 }
      );
    }

    await dispatchEmail({
      name,
      email,
      subject,
      body: messageText,
    });

    return NextResponse.json({
      ok: true,
      data: {
        accepted: true,
        message: "Message received! I'll get back to you as soon as possible.",
      },
      meta: {
        requestId: `req_${Date.now()}`,
      },
    });
  } catch (err) {
    console.error('[Contact API] Uncaught handler error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL',
          message: 'Something went wrong. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
