/**
 * PreQualy — Supabase Edge Function: submit-contact
 * ──────────────────────────────────────────────────
 * Accepts POST /functions/v1/submit-contact with { name, email, message }
 * from the "Send Us a Message" contact form and delivers it to
 * support@prequaly.ai via Mailjet, with Reply-To set to the sender so
 * support can reply directly from their inbox.
 *
 * Uses the same Mailjet credentials already configured for submit-interest —
 * no new secrets required.
 *
 * Required Edge Function secrets (already set via `supabase secrets set`):
 *   MAILJET_API_KEY     — Mailjet API Key
 *   MAILJET_SECRET_KEY  — Mailjet Secret Key
 */

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const SUPPORT_INBOX = "support@prequaly.ai";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Mailjet: deliver the contact message to the support inbox ─────────────────
async function sendContactEmail(
  name: string,
  fromEmail: string,
  message: string,
  apiKey: string,
  secretKey: string,
): Promise<void> {
  const textBody = `New message from the PreQualy contact form.

Name:  ${name}
Email: ${fromEmail}

Message:
${message}

──────────────────────────────────────────────
Reply directly to this email to respond to ${name}.`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,34,51,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0A2233 0%,#123B57 100%);padding:28px 40px;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">New Contact Form Message</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0 0 6px;font-size:13px;color:#61708f;text-transform:uppercase;letter-spacing:.5px;">From</p>
              <p style="margin:0;font-size:16px;color:#0A2233;font-weight:700;">${escapeHtml(name)}</p>
              <p style="margin:2px 0 0;font-size:14px;color:#19C9DB;">${escapeHtml(fromEmail)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 36px;">
              <p style="margin:0 0 8px;font-size:13px;color:#61708f;text-transform:uppercase;letter-spacing:.5px;">Message</p>
              <p style="margin:0;font-size:15px;color:#1F2933;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const credentials = btoa(`${apiKey}:${secretKey}`);

  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify({
      Messages: [{
        From: {
          Email: "noreply@prequaly.ai",
          Name:  "PreQualy Contact Form",
        },
        To: [{
          Email: SUPPORT_INBOX,
        }],
        ReplyTo: {
          Email: fromEmail,
          Name:  name,
        },
        Subject: `New contact form message from ${name}`,
        TextPart: textBody,
        HTMLPart: htmlBody,
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mailjet send failed ${res.status}: ${body}`);
  }

  const data = await res.json();
  const msgStatus = data?.Messages?.[0]?.Status ?? "unknown";
  console.log(`[Mailjet] Contact message from ${fromEmail} to ${SUPPORT_INBOX} — status: ${msgStatus}`);
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(await req.text());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Honeypot check ──────────────────────────────────────────────────────────
  if (payload.company_website && String(payload.company_website).trim() !== "") {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const name    = String(payload.name    ?? "").trim();
  const email   = String(payload.email   ?? "").trim().toLowerCase();
  const message = String(payload.message ?? "").trim();

  if (!name) {
    return new Response(JSON.stringify({ error: "Your name is required." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "A valid email address is required." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  if (!message) {
    return new Response(JSON.stringify({ error: "A message is required." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const mailjetApiKey    = Deno.env.get("MAILJET_API_KEY")    ?? "";
  const mailjetSecretKey = Deno.env.get("MAILJET_SECRET_KEY") ?? "";

  if (!mailjetApiKey || !mailjetSecretKey) {
    console.error("[Mailjet] MAILJET_API_KEY or MAILJET_SECRET_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email is not configured. Please try again later." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  try {
    await sendContactEmail(name, email, message, mailjetApiKey, mailjetSecretKey);
  } catch (err) {
    console.error("[Mailjet] Error:", (err as Error).message);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send message. Please try again." }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
