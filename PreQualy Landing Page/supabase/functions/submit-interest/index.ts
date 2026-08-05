/**
 * PreQualy — Supabase Edge Function: submit-interest
 * ─────────────────────────────────────────────────
 * Accepts POST /functions/v1/submit-interest with the form payload from
 * index.html and performs:
 *   1. Inserts the record into the correct per-audience Supabase table (source of truth)
 *   2. Creates/updates a HubSpot Contact via the Contacts API (non-blocking — HubSpot
 *      failure does NOT fail the overall response or the user's experience)
 *   3. Sends a no-reply confirmation email via Mailjet (non-blocking — email
 *      failure does NOT fail the overall response or the user's experience)
 *
 * Why Contacts API instead of Forms API?
 *   HubSpot's free tier limits custom properties to 10 per object type,
 *   making it impractical to configure four separate forms with many fields.
 *   The Contacts API approach requires NO forms in HubSpot and uses only
 *   standard (unlimited) contact properties + 1 custom property.
 *
 * Required Edge Function secrets (set via `supabase secrets set`):
 *   SUPABASE_URL                — auto-injected by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY   — auto-injected by Supabase runtime
 *   HUBSPOT_ACCESS_TOKEN        — Private App token from HubSpot
 *   MAILJET_API_KEY             — Mailjet API Key (for confirmation emails)
 *   MAILJET_SECRET_KEY          — Mailjet Secret Key (for confirmation emails)
 *
 * One-time HubSpot setup:
 *   1. Create a Private App with scopes:
 *        crm.objects.contacts.write
 *        crm.objects.contacts.read
 *   2. Create ONE custom Contact property: "prequaly_audience" (single-line text)
 *   3. In HubSpot, create 4 Active Segments (Contacts → Lists/Segments) and
 *      set a filter on each: "prequaly_audience is equal to [audience value]"
 *      HubSpot auto-populates these from the property — no API enrollment needed.
 *
 * How audience segmentation works:
 *   Every contact upserted here gets prequaly_audience = "Future Homebuyer" (etc.)
 *   HubSpot Active Segments filtered on prequaly_audience auto-sort every contact.
 *   This is more reliable than manual API enrollment because:
 *     • Active Segments cannot accept manual API enrollment (HubSpot rejects it)
 *     • The approach requires zero extra scopes
 *     • Even past contacts are retroactively included when the filter is applied
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS headers ──────────────────────────────────────────────────────────────
// For production, restrict Access-Control-Allow-Origin to "https://prequaly.com"
// by updating the value below before deploying.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// ── Audience → Supabase table mapping ────────────────────────────────────────
const AUDIENCE_TABLE: Record<string, string> = {
  "Future Homebuyer":          "future_homebuyers",
  "Real Estate Professional":  "real_estate_professionals",
  "Government Agency":         "government_agencies",
  "Nonprofit Organization":    "nonprofits",
};

// ── Utility: normalize multi-select values to string[] ────────────────────────
function normalizeArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean)
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch { /* not JSON */ }
    return val.split(",").map(s => s.trim()).filter(Boolean)
  }
  return []
}

// ── Supabase row builder — maps payload → typed table row ─────────────────────
function buildSupabaseRow(audience: string, payload: Record<string, unknown>) {
  const common = {
    source:       payload.source       ?? "interest-landing-page",
    submitted_at: payload.submittedAt  ?? new Date().toISOString(),
    state:        payload.state        ?? null,
    county:       payload.county       ?? null,
    email:        payload.email        ?? null,
    phone:        payload.phone        ?? null,
  };

  switch (audience) {
    case "Future Homebuyer":
      return {
        ...common,
        full_name:      payload.fullName      ?? null,
        timeline:       payload.timeline      ?? null,
        first_time:     payload.firstTime     ?? null,
        household_size: payload.householdSize ? Number(payload.householdSize) : null,
        housing_status: payload.housingStatus ?? null,
        interests:      normalizeArray(payload.interests),
      };

    case "Government Agency":
      return {
        ...common,
        agency_name:    payload.agencyName    ?? payload.fullName ?? null,
        contact_name:   payload.contactName   ?? payload.fullName ?? null,
        title:          payload.title         ?? null,
        agency_type:    payload.agencyType    ?? null,
        familiarity:    payload.familiarity   ?? null,
        pilot_interest: payload.pilotInterest ?? null,
        notes:          payload.notes         ?? null,
      };

    case "Nonprofit Organization":
      return {
        ...common,
        organization_name: payload.organizationName ?? payload.fullName ?? null,
        contact_name:      payload.contactName      ?? payload.fullName ?? null,
        title:             payload.title            ?? null,
        mission_area:      payload.missionArea      ?? null,
        populations:       normalizeArray(payload.populations),
        interests:         normalizeArray(payload.interests),
      };

    case "Real Estate Professional":
      return {
        ...common,
        full_name:      payload.fullName     ?? null,
        profession:     payload.profession   ?? null,
        company:        payload.company      ?? null,
        title:          payload.title        ?? null,
        markets:        payload.markets      ?? null,
        experience:     payload.experience   ? Number(payload.experience) : null,
        annual_clients: payload.annualClients ?? null,
        interests:      normalizeArray(payload.interests),
      };

    default:
      return common;
  }
}

// ── HubSpot: standard contact properties ─────────────────────────────────────
/**
 * Maps our payload to standard HubSpot Contact properties.
 * Standard properties are unlimited on all HubSpot tiers.
 * The only custom property used is "prequaly_audience".
 */
function buildHubSpotContactProperties(
  audience: string,
  payload: Record<string, unknown>,
): Record<string, string> {
  const props: Record<string, string> = {};

  props.email = String(payload.email ?? "").toLowerCase().trim();

  const rawName = String(
    payload.fullName      ??
    payload.contactName   ??
    payload.agencyName    ??
    payload.organizationName ?? ""
  ).trim();

  if (rawName) {
    const parts = rawName.split(/\s+/)
    props.firstname = parts[0] ?? ""
    if (parts.length > 1) props.lastname = parts.slice(1).join(" ")
  }

  if (payload.phone)  props.phone = String(payload.phone)
  if (payload.state)  props.state = String(payload.state)
  if (payload.county) props.city  = String(payload.county)

  switch (audience) {
    case "Future Homebuyer":
      break
    case "Government Agency":
      if (payload.agencyName)  props.company  = String(payload.agencyName)
      if (payload.title)       props.jobtitle = String(payload.title)
      break
    case "Nonprofit Organization":
      if (payload.organizationName) props.company  = String(payload.organizationName)
      if (payload.title)            props.jobtitle = String(payload.title)
      break
    case "Real Estate Professional":
      if (payload.company)    props.company  = String(payload.company)
      if (payload.title)      props.jobtitle = String(payload.title)
      if (payload.profession) props.jobtitle = String(payload.profession)
      break
  }

  props.prequaly_audience = audience
  props.hs_lead_status = "NEW"

  return props
}

// ── HubSpot API calls ─────────────────────────────────────────────────────────

/**
 * Upserts a HubSpot contact by email using the batch upsert endpoint.
 * Creates the contact if new, updates if the email already exists.
 * Returns the HubSpot contact ID (string) on success.
 */
async function upsertHubSpotContact(
  email: string,
  properties: Record<string, string>,
  accessToken: string,
): Promise<string | null> {
  const res = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        inputs: [{
          idProperty: "email",
          id: email,
          properties,
        }],
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HubSpot contact upsert ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.results?.[0]?.id ?? null
}

/**
 * Adds a contact to a HubSpot static or active list by the contact's numeric
 * record ID. Uses the v3 Lists memberships endpoint.
 *
 * Requires scope: crm.lists.write
 * Docs: PUT /crm/v3/lists/{listId}/memberships/add-from-ids
 */
async function addContactToHubSpotList(
  contactId: string,
  listId: string,
  accessToken: string,
): Promise<void> {
  if (!listId || !contactId) return

  const res = await fetch(
    `https://api.hubapi.com/crm/v3/lists/${listId}/memberships/add-from-ids`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ recordIds: [contactId] }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    if (res.status === 400 && text.includes("already")) {
      console.log(`[HubSpot] Contact ${contactId} already in list ${listId}`)
      return
    }
    console.error(`[HubSpot] List enrollment failed ${res.status} for list ${listId}: ${text}`)
  } else {
    console.log(`[HubSpot] Contact ${contactId} enrolled in list ${listId}`)
  }
}

// ── Mailjet: confirmation email ───────────────────────────────────────────────

/**
 * Sends a no-reply confirmation email to the submitter via Mailjet.
 * Uses HTTP Basic Auth (API Key : Secret Key) and the Mailjet Send API v3.1.
 * Non-blocking — caller should fire-and-forget; failure is only logged.
 */
async function sendConfirmationEmail(
  toEmail: string,
  firstName: string,
  apiKey: string,
  secretKey: string,
): Promise<void> {
  const greeting = firstName ? `Hi ${firstName},` : "Hello,"

  // ── Plain-text fallback ──────────────────────────────────────────────────
  const textBody = `${greeting}

Thank you for joining the PreQualy interest list!

We are building a housing technology platform that will make it easier to find homebuyer assistance programs, affordable mortgage options, grants, and income-restricted homeownership opportunities in one centralized location.

As a member of our interest list, you may receive updates about:
  • PreQualy's platform launch
  • Early-access and pilot opportunities
  • New homeownership resources and programs
  • Community events, webinars, and information sessions
  • Partnership and professional opportunities, when applicable

No additional action is required at this time. We will contact you as new information and opportunities become available.

Thank you for your interest in PreQualy and for joining us as we work to make the path to homeownership easier to navigate.

The PreQualy Team
PreQualy Inc.
prequaly.ai

──────────────────────────────────────────────
Please do not reply to this automated message. This inbox is not monitored.`

  // ── HTML email ───────────────────────────────────────────────────────────
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to the PreQualy Interest List</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,34,51,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A2233 0%,#123B57 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PreQualy</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:0.5px;text-transform:uppercase;">Unlocking Opportunities for Homeownership</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0;font-size:16px;color:#1F2933;line-height:1.6;">${greeting}</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0;font-size:16px;color:#1F2933;line-height:1.7;">
                Thank you for joining the PreQualy interest list!
              </p>
              <p style="margin:16px 0 0;font-size:15px;color:#61708f;line-height:1.7;">
                We are building a housing technology platform that will make it easier to find homebuyer assistance programs, affordable mortgage options, grants, and income-restricted homeownership opportunities in one centralized location.
              </p>
            </td>
          </tr>

          <!-- What you may receive -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#0A2233;">As a member of our interest list, you may receive updates about:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f7f9;border-radius:10px;padding:6px 0;">
                <tr><td style="padding:10px 20px;font-size:14px;color:#61708f;line-height:1.6;">
                  <span style="color:#19C9DB;font-weight:700;margin-right:8px;">&#8226;</span>PreQualy's platform launch
                </td></tr>
                <tr><td style="padding:4px 20px 10px;font-size:14px;color:#61708f;line-height:1.6;">
                  <span style="color:#19C9DB;font-weight:700;margin-right:8px;">&#8226;</span>Early-access and pilot opportunities
                </td></tr>
                <tr><td style="padding:4px 20px 10px;font-size:14px;color:#61708f;line-height:1.6;">
                  <span style="color:#19C9DB;font-weight:700;margin-right:8px;">&#8226;</span>New homeownership resources and programs
                </td></tr>
                <tr><td style="padding:4px 20px 10px;font-size:14px;color:#61708f;line-height:1.6;">
                  <span style="color:#19C9DB;font-weight:700;margin-right:8px;">&#8226;</span>Community events, webinars, and information sessions
                </td></tr>
                <tr><td style="padding:4px 20px 14px;font-size:14px;color:#61708f;line-height:1.6;">
                  <span style="color:#19C9DB;font-weight:700;margin-right:8px;">&#8226;</span>Partnership and professional opportunities, when applicable
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- No action required -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0;font-size:15px;color:#61708f;line-height:1.7;">
                No additional action is required at this time. We will contact you as new information and opportunities become available.
              </p>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0;font-size:15px;color:#1F2933;line-height:1.7;">
                Thank you for your interest in PreQualy and for joining us as we work to make the path to homeownership easier to navigate.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#0A2233;line-height:1.6;">The PreQualy Team</p>
              <p style="margin:4px 0 0;font-size:14px;color:#61708f;line-height:1.6;">PreQualy Inc.</p>
              <p style="margin:2px 0 0;font-size:14px;color:#19C9DB;">prequaly.ai</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:32px 40px 0;">
              <hr style="border:none;border-top:1px solid #dfe9ef;margin:0;" />
            </td>
          </tr>

          <!-- Footer / disclaimer -->
          <tr>
            <td style="padding:20px 40px 36px;">
              <p style="margin:0;font-size:12px;color:#9ba8b5;line-height:1.6;text-align:center;">
                Please do not reply to this automated message. This inbox is not monitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  // ── Mailjet Send API v3.1 ────────────────────────────────────────────────
  const credentials = btoa(`${apiKey}:${secretKey}`)

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
          Name:  "PreQualy",
        },
        To: [{
          Email: toEmail,
        }],
        Subject: "Thank You for Joining the PreQualy Interest List",
        TextPart: textBody,
        HTMLPart: htmlBody,
      }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mailjet send failed ${res.status}: ${body}`)
  }

  const data = await res.json()
  const msgStatus = data?.Messages?.[0]?.Status ?? "unknown"
  console.log(`[Mailjet] Email to ${toEmail} — status: ${msgStatus}`)
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(await req.text())
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // ── Honeypot check ──────────────────────────────────────────────────────────
  if (payload.company_website && String(payload.company_website).trim() !== "") {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // ── Validate required fields ─────────────────────────────────────────────────
  const audience = String(payload.audience ?? "").trim()
  const email    = String(payload.email    ?? "").trim().toLowerCase()

  if (!audience || !AUDIENCE_TABLE[audience]) {
    return new Response(
      JSON.stringify({ error: `Unknown audience: "${audience}"` }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ error: "A valid email address is required." }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }
  payload.email = email

  // ── Derive first name for personalised email greeting ────────────────────────
  const rawName = String(
    payload.fullName        ??
    payload.contactName     ??
    payload.agencyName      ??
    payload.organizationName ?? ""
  ).trim()
  const firstName = rawName ? rawName.split(/\s+/)[0] : ""

  const tableName   = AUDIENCE_TABLE[audience]
  const accessToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN") ?? ""

  // ── Mailjet credentials ───────────────────────────────────────────────────
  const mailjetApiKey    = Deno.env.get("MAILJET_API_KEY")    ?? ""
  const mailjetSecretKey = Deno.env.get("MAILJET_SECRET_KEY") ?? ""

  // ── Supabase service-role client ────────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  )

  // ── HubSpot write (fire-and-forget, non-blocking) ────────────────────────────
  // We deliberately do NOT await this before returning — Supabase is the source
  // of truth. HubSpot failure is logged server-side but never surfaces to users.
  const hubspotPromise: Promise<void> = (accessToken
    ? (async () => {
        try {
          const contactProps = buildHubSpotContactProperties(audience, payload)
          const contactId = await upsertHubSpotContact(email, contactProps, accessToken)
          console.log(`[HubSpot] Contact upserted — id: ${contactId}, email: ${email}, audience: ${audience}`)
          // Segmentation is handled entirely by HubSpot Active Segments filtered on
          // the prequaly_audience property — no manual list enrollment API call needed.
        } catch (err) {
          console.error("[HubSpot] Error:", (err as Error).message)
        }
      })()
    : Promise.resolve(
        console.warn("[HubSpot] Skipped — HUBSPOT_ACCESS_TOKEN not configured")
      )
  )

  // ── Supabase INSERT (source of truth — blocking) ──────────────────────────────
  const row = buildSupabaseRow(audience, payload)
  const { error: dbError } = await supabase.from(tableName).insert(row)

  // Let HubSpot finish in the background
  hubspotPromise.catch(() => {/* already logged */})

  if (dbError) {
    console.error("[Supabase] Insert error:", dbError.message)
    return new Response(
      JSON.stringify({ success: false, error: "Failed to save submission. Please try again." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  console.log(`[Supabase] Inserted into ${tableName} for ${email}`)

  // ── Mailjet confirmation email (fire-and-forget, non-blocking) ───────────────
  // Runs only after Supabase confirms the write. Email failure never surfaces to users.
  if (mailjetApiKey && mailjetSecretKey) {
    sendConfirmationEmail(email, firstName, mailjetApiKey, mailjetSecretKey)
      .catch(err => console.error("[Mailjet] Error:", (err as Error).message))
  } else {
    console.warn("[Mailjet] Skipped — MAILJET_API_KEY or MAILJET_SECRET_KEY not configured")
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
})
