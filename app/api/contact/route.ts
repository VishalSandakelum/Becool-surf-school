import { NextResponse } from "next/server";
import { getTransporter, MAIL_CONFIG } from "../../../lib/mail";
import { BUSINESS } from "../../../src/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  // Honeypot — real visitors leave this blank, bots fill it in.
  website?: string;
};

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 50);
  const subject = clean(body.subject, 200) || "New enquiry";
  const message = clean(body.message, 5000);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email and message are required." },
      { status: 400 }
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const transporter = getTransporter();
  const submittedAt = new Date().toISOString();

  await transporter.sendMail({
    from: `"${name} via Be Cool Surf School" <${MAIL_CONFIG.fromEmail}>`,
    to: MAIL_CONFIG.toEmail,
    replyTo: `${name} <${email}>`,
    subject: `[Website] ${subject}`,
    text: ownerEmailText({ name, email, phone, subject, message, submittedAt }),
    html: ownerEmailHtml({ name, email, phone, subject, message, submittedAt }),
  });

  await transporter.sendMail({
    from: `"${MAIL_CONFIG.fromName}" <${MAIL_CONFIG.fromEmail}>`,
    to: email,
    subject: `We got your message — ${MAIL_CONFIG.fromName}`,
    text: visitorEmailText({ name, subject, message }),
    html: visitorEmailHtml({ name, subject, message }),
  });

  return NextResponse.json({ ok: true });
}

function clean(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Fields = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submittedAt: string;
};

function ownerEmailText(f: Fields): string {
  return [
    `New website enquiry — ${f.subject}`,
    "",
    `Name:    ${f.name}`,
    `Email:   ${f.email}`,
    f.phone ? `Phone:   ${f.phone}` : null,
    `Sent:    ${f.submittedAt}`,
    "",
    "Message:",
    f.message,
  ]
    .filter(Boolean)
    .join("\n");
}

function ownerEmailHtml(f: Fields): string {
  const phoneRow = f.phone
    ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Phone</td><td>${escape(f.phone)}</td></tr>`
    : "";
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <h2 style="margin:0 0 16px;color:#0a3d62;">New website enquiry</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;width:80px;">Subject</td><td><strong>${escape(f.subject)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Name</td><td>${escape(f.name)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Email</td><td><a href="mailto:${escape(f.email)}">${escape(f.email)}</a></td></tr>
    ${phoneRow}
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Sent</td><td>${escape(f.submittedAt)}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>
  <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${escape(f.message)}</div>
</div>
</body></html>`;
}

function visitorEmailText(f: Pick<Fields, "name" | "subject" | "message">): string {
  return [
    `Hi ${f.name},`,
    "",
    `Thanks for getting in touch with ${MAIL_CONFIG.fromName}. We've received your message and will get back to you shortly.`,
    "",
    "For your records, here is a copy of what you sent:",
    "",
    `Subject: ${f.subject}`,
    "",
    f.message,
    "",
    "If you need an immediate reply, you can reach us on WhatsApp:",
    BUSINESS.whatsapp,
    "",
    "— The Be Cool team",
    BUSINESS.address.streetAddress + ", " + BUSINESS.address.addressLocality,
  ].join("\n");
}

function visitorEmailHtml(f: Pick<Fields, "name" | "subject" | "message">): string {
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <h2 style="margin:0 0 8px;color:#0a3d62;">Thanks, ${escape(f.name)} — we got your message.</h2>
  <p style="color:#475569;font-size:15px;line-height:1.6;">
    We'll get back to you as soon as we can. Below is a copy of what you sent for your records.
  </p>
  <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin:20px 0;">
    <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Subject</div>
    <div style="font-weight:600;margin-bottom:14px;">${escape(f.subject)}</div>
    <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Your message</div>
    <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${escape(f.message)}</div>
  </div>
  <p style="color:#475569;font-size:14px;line-height:1.6;">
    Need an immediate reply? Message us on
    <a href="${BUSINESS.whatsapp}" style="color:#0a3d62;">WhatsApp</a>
    or call <a href="tel:${BUSINESS.phone}" style="color:#0a3d62;">${BUSINESS.phone}</a>.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;"/>
  <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
    ${MAIL_CONFIG.fromName}<br/>
    ${BUSINESS.address.streetAddress}, ${BUSINESS.address.addressLocality}, ${BUSINESS.address.addressCountry}
  </p>
</div>
</body></html>`;
}
