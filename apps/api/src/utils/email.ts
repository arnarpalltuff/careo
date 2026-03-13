import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@elderlink.app';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
