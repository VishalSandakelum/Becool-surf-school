import nodemailer, { type Transporter } from "nodemailer";

/**
 * Lazily-built singleton SMTP transporter. Built once per server process so
 * Nodemailer can reuse the connection pool across form submissions.
 */
let cached: Transporter | null = null;

export function getTransporter(): Transporter {
  if (cached) return cached;

  const host = required("SMTP_HOST");
  const port = Number(required("SMTP_PORT"));
  const secure = (process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";
  const user = required("SMTP_USER");
  const pass = required("SMTP_PASSWORD");

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
  });
  return cached;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Copy .env.local.example to .env.local and fill in the SMTP values.`
    );
  }
  return v;
}

export const MAIL_CONFIG = {
  toEmail:
    process.env.CONTACT_TO_EMAIL ||
    process.env.SMTP_USER ||
    "info@becoolsrilanka.com",
  fromEmail:
    process.env.CONTACT_FROM_EMAIL ||
    process.env.SMTP_USER ||
    "info@becoolsrilanka.com",
  fromName: process.env.CONTACT_FROM_NAME || "Be Cool Surf School",
};
