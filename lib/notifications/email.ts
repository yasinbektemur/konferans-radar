import { Resend } from "resend";

export async function sendEmailNotification({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY missing" };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to,
    subject,
    text,
  });

  if (result.error) {
    return { ok: false, reason: result.error.message };
  }

  return { ok: true };
}
