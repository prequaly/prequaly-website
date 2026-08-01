/**
 * PreQualy CSV Parser
 * Parses CSV text into structured data keyed to each stakeholder type.
 * Auto-detects type from column headers; returns { type, headers, rows, summary, error }.
 */

// ── Stakeholder type signatures (distinctive columns per form) ──────────────
const TYPE_SIGNATURES = {
  future_homebuyers: [
    ['planned purchase timeline', 'purchase timeline', 'timeline'],
    ['household size', 'multigenerational'],
  ],
  government_agencies: [
    ['agency type', 'primary service area'],
    ['familiarity with homeownership', 'interest in pilot'],
  ],
  nonprofits: [
    ['organization type', 'cdfi'],
    ['affordable homeownership program focus', 'program focus'],
  ],
  real_estate_professionals: [
    ['professional role', 'years of experience'],
    ['do you currently work', 'primary focus area'],
  ],
}

const TYPE_LABELS = {
  future_homebuyers:        'Future Homebuyers',
  government_agencies:      'Government Agencies',
  nonprofits:               'Nonprofits',
  real_estate_professionals:'Real Estate Professionals',
}

// ── Core CSV parser (no external deps) ────────────────────────────────────────
function parseCSVText(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const result = []

  for (const line of lines) {
    if (!line.trim()) continue
    const row = []
    let inQuote = false
    let cell = ''

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        row.push(cell.trim())
        cell = ''
      } else {
        cell += ch
      }
    }
    row.push(cell.trim())
    result.push(row)
  }
  return result
}

// ── Detect stakeholder type from normalized headers ────────────────────────
function detectType(headers) {
  const norm = headers.map(h => h.toLowerCase())

  for (const [type, sigGroups] of Object.entries(TYPE_SIGNATURES)) {
    let matched = 0
    for (const group of sigGroups) {
      const hit = group.some(kw => norm.some(h => h.includes(kw)))
      if (hit) matched++
    }
    if (matched >= 1) return type
  }
  return null
}

// ── Build summary stats from parsed rows ──────────────────────────────────
function buildSummary(type, headers, rows) {
  const col = (keywords) => {
    const kws = Array.isArray(keywords) ? keywords : [keywords]
    return headers.findIndex(h =>
      kws.some(k => h.toLowerCase().includes(k.toLowerCase()))
    )
  }
  const colValues = (idx) => rows.map(r => r[idx]).filter(Boolean)
  const countBy = (idx) => {
    const counts = {}
    colValues(idx).forEach(v => { counts[v] = (counts[v] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }

  const summary = { count: rows.length, type, label: TYPE_LABELS[type] }

  const stateIdx = col(['location of interest', 'state'])
  if (stateIdx >= 0) summary.byState = countBy(stateIdx)

  const countyIdx = col(['county'])
  if (countyIdx >= 0) summary.byCounty = countBy(countyIdx)

  switch (type) {
    case 'future_homebuyers': {
      const tlIdx = col(['planned purchase timeline', 'timeline'])
      const hsIdx = col(['household size'])
      if (tlIdx >= 0) summary.byTimeline = countBy(tlIdx)
      if (hsIdx >= 0) summary.byHouseholdSize = countBy(hsIdx)
      break
    }
    case 'government_agencies': {
      const atIdx = col(['agency type'])
      const psIdx = col(['primary service area'])
      if (atIdx >= 0) summary.byAgencyType    = countBy(atIdx)
      if (psIdx >= 0) summary.byServiceArea   = countBy(psIdx)
      break
    }
    case 'nonprofits': {
      const otIdx = col(['organization type'])
      const pfIdx = col(['affordable homeownership program focus', 'program focus'])
      if (otIdx >= 0) summary.byOrgType  = countBy(otIdx)
      if (pfIdx >= 0) summary.byFocus    = countBy(pfIdx)
      break
    }
    case 'real_estate_professionals': {
      const roleIdx = col(['professional role'])
      const yeIdx   = col(['years of experience'])
      const pfIdx   = col(['primary focus area'])
      if (roleIdx >= 0) summary.byRole       = countBy(roleIdx)
      if (yeIdx >= 0)   summary.byExperience = countBy(yeIdx)
      if (pfIdx >= 0)   summary.byFocusArea  = countBy(pfIdx)
      break
    }
    default:
      break
  }

  return summary
}

// ── Public API ─────────────────────────────────────────────────────────────
/**
 * Parse CSV file text.
 * @param {string} text - Raw CSV string
 * @param {string|null} forcedType - Override auto-detection
 * @returns {{ type, label, headers, rows, summary, preview, error }}
 */
export function parseCSV(text, forcedType = null) {
  try {
    const all = parseCSVText(text)
    if (all.length < 2) return { error: 'CSV must have at least one header row and one data row.' }

    const headers = all[0]
    const rows    = all.slice(1).filter(r => r.some(c => c.length > 0))

    if (headers.length === 0) return { error: 'No column headers found.' }
    if (rows.length === 0)    return { error: 'No data rows found.' }

    const type    = forcedType || detectType(headers)
    const label   = type ? TYPE_LABELS[type] : 'Unknown'
    const summary = type ? buildSummary(type, headers, rows) : { count: rows.length }
    const preview = rows.slice(0, 5)

    return { type, label, headers, rows, summary, preview, error: null }
  } catch (err) {
    return { error: `Parse error: ${err.message}` }
  }
}

export const STAKEHOLDER_TYPES = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
