/**
 * PreQualy — Supabase Edge Function: submit-interest
 * ─────────────────────────────────────────────────
 * Accepts POST /functions/v1/submit-interest with the form payload from
 * index.html and performs a dual-write:
 *   1. Inserts the record into the correct per-audience Supabase table (source of truth)
 *   2. Creates/updates a HubSpot Contact via the Contacts API and attaches a
 *      formatted Note with audience-specific details (non-blocking — HubSpot
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

  // ── Email (required) ───────────────────────────────────────────────────────
  props.email = String(payload.email ?? "").toLowerCase().trim();

  // ── Name — split full_name → firstname / lastname ─────────────────────────
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

  // ── Standard contact fields ────────────────────────────────────────────────
  if (payload.phone)  props.phone = String(payload.phone)
  if (payload.state)  props.state = String(payload.state)
  if (payload.county) props.city  = String(payload.county)  // closest HS standard field

  // ── Audience-specific standard field mappings ─────────────────────────────
  switch (audience) {
    case "Future Homebuyer":
      // No company needed — jobtitle left blank
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

  // ── Custom property: audience tag (the only custom prop needed) ───────────
  // Create this in HubSpot: Contacts → Properties → Create property
  //   Label: "PreQualy Audience"  |  Internal name: prequaly_audience  |  Type: Single-line text
  props.prequaly_audience = audience

  // ── Lead source tracking ──────────────────────────────────────────────────
  props.hs_lead_status = "NEW"

  return props
}

/**
 * Builds a formatted plain-text Note body containing all audience-specific
 * fields that don't fit into standard HubSpot contact properties.
 *
 * NOTE: This function is kept for reference but is no longer called.
 * Audience-specific data is stored in Supabase only.
 * Removing the Notes API call means only 2 HubSpot scopes are needed:
 *   crm.objects.contacts.read  +  crm.objects.contacts.write
 */
function _buildHubSpotNoteBody_unused(audience: string, payload: Record<string, unknown>): string {
  const lines: string[] = [
    `PreQualy Interest Submission`,
    `Audience: ${audience}`,
    `Submitted: ${payload.submittedAt ?? new Date().toISOString()}`,
    `Source: ${payload.source ?? "interest-landing-page"}`,
    `---`,
  ]

  if (payload.state)  lines.push(`State: ${payload.state}`)
  if (payload.county) lines.push(`County: ${payload.county}`)

  switch (audience) {
    case "Future Homebuyer": {
      if (payload.timeline)      lines.push(`Purchase Timeline: ${payload.timeline}`)
      if (payload.firstTime)     lines.push(`First-Time Buyer: ${payload.firstTime}`)
      if (payload.householdSize) lines.push(`Household Size: ${payload.householdSize}`)
      if (payload.housingStatus) lines.push(`Housing Status: ${payload.housingStatus}`)
      const interests = normalizeArray(payload.interests)
      if (interests.length) lines.push(`Interests: ${interests.join(", ")}`)
      break
    }
    case "Government Agency": {
      if (payload.agencyType)    lines.push(`Agency Type: ${payload.agencyType}`)
      if (payload.familiarity)   lines.push(`Familiarity with Programs: ${payload.familiarity}`)
      if (payload.pilotInterest) lines.push(`Pilot Interest: ${payload.pilotInterest}`)
      if (payload.notes)         lines.push(`Notes: ${payload.notes}`)
      break
    }
    case "Nonprofit Organization": {
      if (payload.missionArea)   lines.push(`Mission Area: ${payload.missionArea}`)
      const populations = normalizeArray(payload.populations)
      const interests   = normalizeArray(payload.interests)
      if (populations.length) lines.push(`Populations Served: ${populations.join(", ")}`)
      if (interests.length)   lines.push(`Partnership Interests: ${interests.join(", ")}`)
      break
    }
    case "Real Estate Professional": {
      if (payload.profession)    lines.push(`Profession: ${payload.profession}`)
      if (payload.markets)       lines.push(`Markets/Service Area: ${payload.markets}`)
      if (payload.experience)    lines.push(`Years of Experience: ${payload.experience}`)
      if (payload.annualClients) lines.push(`Annual Clients: ${payload.annualClients}`)
      const interests = normalizeArray(payload.interests)
      if (interests.length) lines.push(`Partnership Interests: ${interests.join(", ")}`)
      break
    }
  }

  return lines.join("\n")
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
    // 400 often means the contact is already in the list — not a real error
    if (res.status === 400 && text.includes("already")) {
      console.log(`[HubSpot] Contact ${contactId} already in list ${listId}`)
      return
    }
    console.error(`[HubSpot] List enrollment failed ${res.status} for list ${listId}: ${text}`)
  } else {
    console.log(`[HubSpot] Contact ${contactId} enrolled in list ${listId}`)
  }
}

/**
 * Creates a HubSpot Note and associates it with a contact.
 *
 * NOTE: This function is kept for reference but is no longer called.
 * Removing the Notes API call eliminates the need for a notes scope.
 */
async function _createHubSpotNote_unused(
  contactId: string,
  body: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(
    "https://api.hubapi.com/crm/v3/objects/notes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        properties: {
          hs_note_body:  body,
          hs_timestamp:  new Date().toISOString(),
        },
        associations: [{
          to:    { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        }],
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error(`[HubSpot] Note creation failed ${res.status}: ${text}`)
  }
}

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

  const tableName    = AUDIENCE_TABLE[audience]
  const accessToken  = Deno.env.get("HUBSPOT_ACCESS_TOKEN") ?? ""

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

  // ── Supabase INSERT (our source of truth — blocking) ─────────────────────────
  const row = buildSupabaseRow(audience, payload)
  const { error: dbError } = await supabase.from(tableName).insert(row)

  // Let HubSpot finish in the background after we've written to Supabase
  hubspotPromise.catch(() => {/* already logged */})

  if (dbError) {
    console.error("[Supabase] Insert error:", dbError.message)
    return new Response(
      JSON.stringify({ success: false, error: "Failed to save submission. Please try again." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  }

  console.log(`[Supabase] Inserted into ${tableName} for ${email}`)

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
})
