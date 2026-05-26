"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Native React contact form. Posts JSON to /api/contact, which:
 *   1. Sends an enquiry email to the business owner.
 *   2. Sends a confirmation email back to the visitor with a copy of their
 *      message (auto-receipt).
 *
 * Honeypot field `website` is hidden from real users via aria-hidden + CSS;
 * spam bots fill it in and the API silently 200s without sending mail.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bcss-form-success" role="status">
        <h3>Thank you — your message is on its way.</h3>
        <p>
          We&apos;ve sent a confirmation copy to your inbox. The team will reply
          shortly.
        </p>
      </div>
    );
  }

  return (
    <form className="bcss-contact-form" onSubmit={onSubmit} noValidate>
      <div className="bcss-form-row">
        <label className="bcss-form-field">
          <span className="bcss-form-label">Your name *</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            disabled={status === "submitting"}
          />
        </label>
        <label className="bcss-form-field">
          <span className="bcss-form-label">Email *</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={status === "submitting"}
          />
        </label>
      </div>
      <div className="bcss-form-row">
        <label className="bcss-form-field">
          <span className="bcss-form-label">Phone (optional)</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={status === "submitting"}
          />
        </label>
        <label className="bcss-form-field">
          <span className="bcss-form-label">Subject</span>
          <input
            name="subject"
            type="text"
            placeholder="Surf lesson enquiry"
            disabled={status === "submitting"}
          />
        </label>
      </div>
      <label className="bcss-form-field bcss-form-field--full">
        <span className="bcss-form-label">Message *</span>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Tell us your dates, group size, and surf experience…"
          disabled={status === "submitting"}
        />
      </label>

      {/* Honeypot — hidden from screen readers and styled off-screen. */}
      <div className="bcss-form-honeypot" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {error && (
        <p className="bcss-form-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="bcss-form-submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
