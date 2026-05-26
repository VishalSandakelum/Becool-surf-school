# Contact form — SMTP setup

The contact form on `/book-now` posts to `/api/contact`, which uses
[Nodemailer](https://nodemailer.com) to send two emails:

1. **To you** (the business): the visitor's enquiry.
2. **To the visitor**: a confirmation receipt with a copy of what they sent.

Both emails go through your business email host's SMTP server, so they
arrive from `info@becoolsrilanka.com` (or whatever address you configure)
and are not flagged as spoofed by Gmail / Outlook.

---

## 1. Find your SMTP credentials

Log in to your email host's control panel and look for "Email accounts"
or "Mail settings". You're looking for **5 values**:

| Variable | Typical value | Where to find it |
|---|---|---|
| `SMTP_HOST` | `smtp.your-host.com` | Email host's documentation |
| `SMTP_PORT` | `465` (SSL) or `587` (STARTTLS) | Same |
| `SMTP_SECURE` | `true` for 465, `false` for 587 | Derived from the port |
| `SMTP_USER` | `info@becoolsrilanka.com` | Your full mailbox address |
| `SMTP_PASSWORD` | the mailbox password | Set when the mailbox was created |

Common hosts:

- **Hostinger** — `smtp.hostinger.com` / port `465` / `SMTP_SECURE=true`
- **Zoho Mail** — `smtp.zoho.com` / port `465` / `SMTP_SECURE=true`
- **Office 365** — `smtp.office365.com` / port `587` / `SMTP_SECURE=false`
- **Google Workspace** — `smtp.gmail.com` / port `465` / `SMTP_SECURE=true` (needs an app password, not your normal password)

---

## 2. Create your `.env.local` file

In the project root (the same folder that holds `package.json`):

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the SMTP values you collected above. Save.

> **Don't commit `.env.local`.** It already lives in `.gitignore` so this
> shouldn't happen by accident, but never paste credentials into Slack,
> issue trackers, or pull requests.

---

## 3. Test locally

```bash
npm run dev
```

Open <http://localhost:3000/book-now>, fill in the form, submit. You should:

- Receive the enquiry email at `CONTACT_TO_EMAIL`.
- Receive the confirmation email at the address you typed into the form.

If sending fails, check the Next.js console for the Nodemailer error.

Common errors:

| Error | Fix |
|---|---|
| `EAUTH … Username and Password not accepted` | Wrong `SMTP_USER` / `SMTP_PASSWORD`, or the host requires an app-specific password (Gmail, Outlook). |
| `connect ETIMEDOUT` | Wrong `SMTP_HOST` or your firewall is blocking outbound 465/587. Try the other port. |
| `wrong version number` / `wrong header` | `SMTP_SECURE` doesn't match the port. Use `true` with 465, `false` with 587. |

---

## 4. Set the same vars on AWS Amplify

In the Amplify Console:

1. Open the app → **Hosting** → **Environment variables**.
2. Add each variable from `.env.local` (host, port, secure, user, password,
   plus the `CONTACT_*` vars).
3. **Redeploy** the branch — env-var changes only take effect on the next
   build.

After deploy, visit `https://becoolsrilanka.com/book-now` and submit a test
message to confirm production is wired up.
