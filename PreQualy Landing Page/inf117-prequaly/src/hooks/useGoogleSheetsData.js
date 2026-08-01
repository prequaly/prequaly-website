/**
 * useGoogleSheetsData
 * Fetches interest-form submissions from Google Sheets via the Apps Script
 * doGet endpoint, aggregates them into dashboard metrics, and auto-refreshes
 * every 60 seconds.
 *
 * Falls back to DUMMY_DATA if the endpoint is unreachable or returns no rows.
 *
 * ── SETUP REQUIRED ──────────────────────────────────────────────────────────
 * Add a doGet handler to your Apps Script and redeploy with "Anyone" access.
 * See the doGet reference artifact in the artifacts directory.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react'
import { DUMMY_DATA } from '../data/dummyDataset'

// In development the Vite server proxies /api/sheets → script.google.com
// (bypassing CORS). In production the full URL is used directly.
// Update VITE_APPS_SCRIPT_URL in .env.local to point at a new deployment
// without touching this file.
const DIRECT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbxUBbD6EV4tjf92gS_dwT-H01nULL4_AebxOo_-NAFrGEKQgBRSDE1Sp9Q4Z6Fr-uG0rw/exec'

const APPS_SCRIPT_URL = import.meta.env.DEV ? '/api/sheets' : DIRECT_URL

const POLL_INTERVAL_MS = 60_000 // re-fetch every 60 seconds

// ── Audience → dashboard key mapping ────────────────────────────────────────
const AUDIENCE_MAP = {
  'Future Homebuyer':         'homebuyers',
  'Real Estate Professional': 'realEstatePros',
  'Government Agency':        'govAgencies',
  'Nonprofit Organization':   'nonprofits',
}

const ICON_KEY_MAP = {
  homebuyers:     'home',
  realEstatePros: 'pro',
  govAgencies:    'agency',
  nonprofits:     'np',
}

// ── Column name normalizer ────────────────────────────────────────────────────
// Maps the exact Google Sheet column headers → the camelCase field names the
// rest of the hook uses. Add any new columns here if the sheet schema changes.
const COLUMN_MAP = {
  // Identity / meta
  'Audience (Form)':         'audience',
  'Submitted At':            'submittedAt',
  'Source':                  'source',
  // Common to all forms
  'Full Name / Contact':     'fullName',
  'Email':                   'email',
  'Phone':                   'phone',
  'State':                   'state',
  'County':                  'county',
  'Interests':               'interests',
  // Homebuyers
  'Timeline':                'timeline',
  'First Time Homebuyer':    'firstTime',
  'Household Size':          'householdSize',
  'Housing Status':          'housingStatus',
  // Real estate pros
  'Profession / Role':       'profession',
  'Company / Agency / Org':  'company',
  'Title':                   'title',
  'Markets / Service Area':  'markets',
  'Years Experience':        'experience',
  'Annual Clients':          'annualClients',
  // Government agencies
  'Agency Type':             'agencyType',
  'Familiarity':             'familiarity',
  'Pilot Interest':          'pilotInterest',
  'Notes':                   'notes',
  // Nonprofits
  'Mission Area':            'missionArea',
  'Populations':             'populations',
}

/**
 * Translate a raw sheet row (with verbose column headers) into the camelCase
 * shape the hook uses internally. Unknown columns are kept under their
 * original key so nothing is lost.
 */
function normalizeRow(raw) {
  const row = {}
  for (const [key, val] of Object.entries(raw)) {
    const mapped = COLUMN_MAP[key]
    if (mapped) {
      row[mapped] = val
    } else {
      // Keep unknown columns under their original key (lowercased, no spaces)
      row[key.toLowerCase().replace(/[^a-z0-9]/g, '_')] = val
    }
  }
  return row
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Count occurrences of each distinct value for a field across rows.
 * Handles arrays, JSON-array strings, and comma-separated strings.
 */
function countBy(rows, key) {
  const counts = {}
  rows.forEach(row => {
    const v = row[key]
    if (v === null || v === undefined || v === '') return
    let vals
    if (Array.isArray(v)) {
      vals = v
    } else {
      // Try JSON.parse for arrays stored as "[...]" strings in Sheets
      try {
        const parsed = JSON.parse(v)
        vals = Array.isArray(parsed) ? parsed : [String(v)]
      } catch {
        vals = String(v).split(',').map(s => s.trim()).filter(Boolean)
      }
    }
    vals.forEach(val => { if (val) counts[val] = (counts[val] || 0) + 1 })
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

/** Bucket numeric experience years into display ranges. */
function bucketExperience(rows) {
  const buckets = { '0–5 yrs': 0, '6–10 yrs': 0, '11–20 yrs': 0, '20+ yrs': 0 }
  rows.forEach(row => {
    const v = parseInt(row.experience, 10)
    if (isNaN(v)) return
    if (v <= 5)  buckets['0–5 yrs']++
    else if (v <= 10) buckets['6–10 yrs']++
    else if (v <= 20) buckets['11–20 yrs']++
    else buckets['20+ yrs']++
  })
  return Object.entries(buckets).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
}

/** Bucket numeric household size into display labels. */
function bucketHouseholdSize(rows) {
  const buckets = {}
  rows.forEach(row => {
    const v = parseInt(row.householdSize, 10)
    if (isNaN(v) || v < 1) return
    const label = v >= 5 ? '5+ people' : `${v} ${v === 1 ? 'person' : 'people'}`
    buckets[label] = (buckets[label] || 0) + 1
  })
  return Object.entries(buckets).sort((a, b) => {
    // Sort numerically by first digit
    return parseInt(a[0]) - parseInt(b[0])
  })
}

/** Build last-7-month labels and per-group monthly submission counts. */
function buildMonthlyTrends(groupedRows) {
  const now = new Date()
  const months = []
  const labels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
    labels.push(d.toLocaleString('default', { month: 'short' }))
  }

  function monthlyCounts(subset) {
    return months.map(({ year, month }) =>
      subset.filter(r => {
        const d = r._date
        return d && d.getFullYear() === year && d.getMonth() === month
      }).length
    )
  }

  return {
    labels,
    homebuyers:  monthlyCounts(groupedRows.homebuyers    || []),
    agencies:    monthlyCounts(groupedRows.govAgencies   || []),
    nonprofits:  monthlyCounts(groupedRows.nonprofits    || []),
    realEstate:  monthlyCounts(groupedRows.realEstatePros || []),
  }
}

/** Build cumulative sparklines from monthly trend arrays. */
function buildSparklines(trends) {
  const cumulate = arr =>
    arr.reduce((acc, v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc }, [])
  const totalArr = trends.homebuyers.map((v, i) =>
    v + trends.agencies[i] + trends.nonprofits[i] + trends.realEstate[i])
  return {
    total:       cumulate(totalArr),
    homebuyers:  cumulate(trends.homebuyers),
    govAgencies: cumulate(trends.agencies),
    nonprofits:  cumulate(trends.nonprofits),
    realEstate:  cumulate(trends.realEstate),
  }
}

/** Compute month-over-month growth % from trend arrays. Returns null if no prior month. */
function computeGrowth(trends) {
  const calc = arr => {
    const last = arr[arr.length - 1] || 0
    const prev = arr[arr.length - 2] || 0
    if (!prev) return null
    const pct = ((last - prev) / prev * 100).toFixed(1)
    return `${pct}%`
  }
  const totals = trends.homebuyers.map((v, i) =>
    v + trends.agencies[i] + trends.nonprofits[i] + trends.realEstate[i])
  return {
    total:          calc(totals),
    homebuyers:     calc(trends.homebuyers),
    govAgencies:    calc(trends.agencies),
    nonprofits:     calc(trends.nonprofits),
    realEstatePros: calc(trends.realEstate),
  }
}

/** Aggregate county and state counts from all rows that have those fields. */
function buildLocationTables(allRows) {
  const countyCounts = {}
  const stateCounts  = {}
  allRows.forEach(row => {
    const county = (row.county || '').trim()
    const state  = (row.state  || '').trim()
    if (county) countyCounts[county] = (countyCounts[county] || 0) + 1
    if (state)  stateCounts[state]   = (stateCounts[state]   || 0) + 1
  })
  const toTableRows = obj =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i, arr) => {
        // Simple delta: compare to next-lower count
        const next = arr[i + 1]?.[1] || count
        const delta = next ? `+${((count - next) / next * 100).toFixed(1)}%` : '+—'
        return { name, count, delta, up: true }
      })
  return {
    countyCounts,
    stateCounts,
    counties: toTableRows(countyCounts),
    states:   toTableRows(stateCounts),
  }
}

/** Scale dummy county map positions to real counts, keeping map layout. */
function buildCountyMap(countyCounts, total) {
  const norm = s => s.toLowerCase().replace(/\s*county\s*/i, '').trim()
  const dummyTotal = DUMMY_DATA.countyMap.reduce((s, c) => s + c.count, 0) || 1
  const scale = total > 0 ? total / dummyTotal : 1

  if (Object.keys(countyCounts).length === 0) {
    // No real data — scale dummy map proportionally
    return DUMMY_DATA.countyMap.map(c => ({ ...c, count: Math.round(c.count * scale) }))
  }

  return DUMMY_DATA.countyMap.map(c => {
    // Try to find a matching real county
    const realKey = Object.keys(countyCounts).find(k => norm(k) === norm(c.name))
    return { ...c, count: realKey ? countyCounts[realKey] : 0 }
  })
}

/** Build per-group field breakdown metrics from grouped rows. */
function buildGroupMetrics(groupedRows) {
  const hb  = groupedRows.homebuyers     || []
  const rep = groupedRows.realEstatePros || []
  const gov = groupedRows.govAgencies    || []
  const np  = groupedRows.nonprofits     || []

  return {
    homebuyers: {
      byTimeline:      countBy(hb,  'timeline'),
      byFirstTime:     countBy(hb,  'firstTime'),
      byHousingStatus: countBy(hb,  'housingStatus'),
      byInterests:     countBy(hb,  'interests'),
      byHouseholdSize: bucketHouseholdSize(hb),
    },
    realEstatePros: {
      byProfession: countBy(rep, 'profession'),
      byExperience: bucketExperience(rep),
      byInterests:  countBy(rep, 'interests'),
    },
    govAgencies: {
      byAgencyType:    countBy(gov, 'agencyType'),
      byFamiliarity:   countBy(gov, 'familiarity'),
      byPilotInterest: countBy(gov, 'pilotInterest'),
    },
    nonprofits: {
      byMissionArea: countBy(np, 'missionArea'),
      byInterests:   countBy(np, 'interests'),
    },
  }
}

/** Build a recent-activity feed from the latest N submissions. */
function buildRecentActivity(allRows, limit = 20) {
  return allRows
    .filter(r => r._date)
    .sort((a, b) => b._date - a._date)
    .slice(0, limit)
    .map(row => {
      const groupKey = AUDIENCE_MAP[row.audience] || 'homebuyers'
      const name     = row.fullName || row.agencyName || row.organization || 'Someone'
      const state    = row.state ? ` from ${row.state}` : ''
      const iconKey  = ICON_KEY_MAP[groupKey] || 'home'

      const diffMs  = Date.now() - row._date.getTime()
      const diffMin = Math.floor(diffMs / 60_000)
      const diffHr  = Math.floor(diffMin / 60)
      const time    = diffMin < 1 ? 'just now'
        : diffMin < 60 ? `${diffMin}m ago`
        : diffHr  < 24 ? `${diffHr}h ago`
        : `${Math.floor(diffHr / 24)}d ago`

      const typeMap = { homebuyers: 'new', govAgencies: 'agency', nonprofits: 'np', realEstatePros: 'pro' }
      return {
        desc:     `${row.audience || 'A stakeholder'}${state} joined the interest list`,
        name,
        time,
        iconKey,
        groupKey,
        type: typeMap[groupKey] || 'new',
      }
    })
}

// ── Core processor ────────────────────────────────────────────────────────────
function processRows(rawRows) {
  if (!rawRows || rawRows.length === 0) return null

  // Normalize sheet column names → camelCase, then attach parsed Date objects
  const rows = rawRows
    .map(raw => {
      const row = normalizeRow(raw)
      row._date = row.submittedAt ? new Date(row.submittedAt) : null
      return row
    })
    .filter(r => r.audience && AUDIENCE_MAP[r.audience])

  if (rows.length === 0) return null

  // Partition rows into groups
  const groupedRows = { homebuyers: [], realEstatePros: [], govAgencies: [], nonprofits: [] }
  rows.forEach(row => groupedRows[AUDIENCE_MAP[row.audience]].push(row))

  const hb    = groupedRows.homebuyers.length
  const rep   = groupedRows.realEstatePros.length
  const ga    = groupedRows.govAgencies.length
  const np    = groupedRows.nonprofits.length
  const total = hb + rep + ga + np

  const trends         = buildMonthlyTrends(groupedRows)
  const sparklines     = buildSparklines(trends)
  const growth         = computeGrowth(trends)
  const { counties, states, countyCounts } = buildLocationTables(rows)
  const countyMap      = buildCountyMap(countyCounts, total)
  const groupMetrics   = buildGroupMetrics(groupedRows)
  const recentActivity = buildRecentActivity(rows)

  return {
    kpis: { totalInterests: total, homebuyers: hb, govAgencies: ga, nonprofits: np, realEstatePros: rep },
    sparklines,
    trends,
    growth,
    counties:  counties.length > 0 ? counties  : DUMMY_DATA.counties,
    states:    states.length   > 0 ? states    : DUMMY_DATA.states,
    countyMap: countyMap.length > 0 ? countyMap : DUMMY_DATA.countyMap,
    groupMetrics,
    recentActivity,
  }
}

// ── Public hook ───────────────────────────────────────────────────────────────
export function useGoogleSheetsData() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [isLive, setIsLive]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: 'GET' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json()
      const processed = processRows(Array.isArray(raw) ? raw : [])
      if (processed) {
        setData(processed)
        setIsLive(true)
      } else {
        // Sheet is accessible but has no valid rows yet — show demo data
        setData({ ...DUMMY_DATA, groupMetrics: null, recentActivity: [], growth: {} })
        setIsLive(false)
      }
    } catch (err) {
      setError(err.message)
      setData({ ...DUMMY_DATA, groupMetrics: null, recentActivity: [], growth: {} })
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, isLive, refetch: fetchData }
}
