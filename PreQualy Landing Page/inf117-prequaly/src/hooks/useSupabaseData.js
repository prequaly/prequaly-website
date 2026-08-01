/**
 * useSupabaseData
 * ──────────────────────────────────────────────────────────────────────────────
 * Fetches interest-form submissions from all four per-audience Supabase tables,
 * aggregates them into the same dashboard metrics shape produced by
 * useGoogleSheetsData, and returns live KPIs, sparklines, trends, county/state
 * tables, group breakdown metrics, and a recent activity feed.
 *
 * Falls back to DUMMY_DATA if Supabase credentials are not configured or the
 * tables don't yet have any rows.
 *
 * Required .env.local variables:
 *   VITE_SUPABASE_URL      — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — the anon/public key (safe to expose in browser)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { DUMMY_DATA } from '../data/dummyDataset'

// ── Constants ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS   = 60_000    // re-fetch every 60 s (same as old hook)
const ACTIVITY_LIMIT     = 50        // max rows to pull for the activity feed
const TREND_ROW_LIMIT    = 5000      // max rows for monthly trend + location computation

// Icon/type keys for the activity feed
const ICON_KEY_MAP = {
  future_homebuyers:          'home',
  government_agencies:        'agency',
  nonprofits:                 'np',
  real_estate_professionals:  'pro',
}
const TYPE_MAP = {
  future_homebuyers:          'new',
  government_agencies:        'agency',
  nonprofits:                 'np',
  real_estate_professionals:  'pro',
}
const AUDIENCE_LABEL = {
  future_homebuyers:          'Future Homebuyer',
  government_agencies:        'Government Agency',
  nonprofits:                 'Nonprofit Organization',
  real_estate_professionals:  'Real Estate Professional',
}
// Maps table key → dashboard kpiKey
const TABLE_KPI_KEY = {
  future_homebuyers:          'homebuyers',
  government_agencies:        'govAgencies',
  nonprofits:                 'nonprofits',
  real_estate_professionals:  'realEstatePros',
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

/** COUNT(*) for a table; returns null on any error so callers can detect failures */
async function safeCount(table) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    if (error) { console.warn(`[Supabase] count ${table}:`, error.message); return null }
    return count ?? 0
  } catch (e) {
    console.warn(`[Supabase] count ${table}:`, e.message)
    return null
  }
}

/** Lightweight SELECT with optional column list, limit, and ordering */
async function safeSelect(table, columns = '*', { limit, orderBy, ascending = false } = {}) {
  try {
    let q = supabase.from(table).select(columns)
    if (limit)   q = q.limit(limit)
    if (orderBy) q = q.order(orderBy, { ascending })
    const { data, error } = await q
    if (error) { console.warn(`[Supabase] select ${table}:`, error.message); return null }
    return data ?? []
  } catch (e) {
    console.warn(`[Supabase] select ${table}:`, e.message)
    return null
  }
}

// ── Aggregation helpers ───────────────────────────────────────────────────────

/**
 * Count occurrences of each distinct value for a field.
 * Handles regular strings, comma-separated strings, and arrays.
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

/** Bucket numeric `experience` (integer years) into display ranges */
function bucketExperience(rows) {
  const buckets = { '0–5 yrs': 0, '6–10 yrs': 0, '11–20 yrs': 0, '20+ yrs': 0 }
  rows.forEach(row => {
    const v = parseInt(row.experience, 10)
    if (isNaN(v)) return
    if (v <= 5)       buckets['0–5 yrs']++
    else if (v <= 10) buckets['6–10 yrs']++
    else if (v <= 20) buckets['11–20 yrs']++
    else              buckets['20+ yrs']++
  })
  return Object.entries(buckets).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
}

/** Bucket `household_size` integer into display labels */
function bucketHouseholdSize(rows) {
  const buckets = {}
  rows.forEach(row => {
    const v = parseInt(row.household_size, 10)
    if (isNaN(v) || v < 1) return
    const label = v >= 5 ? '5+ people' : `${v} ${v === 1 ? 'person' : 'people'}`
    buckets[label] = (buckets[label] || 0) + 1
  })
  return Object.entries(buckets).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
}

/** Build last-7-month labels and per-group monthly submission counts */
function buildMonthlyTrends(groupedRows) {
  const now = new Date()
  const months = []
  const labels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
    labels.push(d.toLocaleString('default', { month: 'short' }))
  }

  const monthlyCounts = subset =>
    months.map(({ year, month }) =>
      subset.filter(r => {
        if (!r._date) return false
        return r._date.getFullYear() === year && r._date.getMonth() === month
      }).length
    )

  return {
    labels,
    homebuyers:  monthlyCounts(groupedRows.homebuyers    || []),
    agencies:    monthlyCounts(groupedRows.govAgencies   || []),
    nonprofits:  monthlyCounts(groupedRows.nonprofits    || []),
    realEstate:  monthlyCounts(groupedRows.realEstatePros || []),
  }
}

/** Build cumulative sparklines from monthly trend arrays */
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

/** Compute month-over-month growth % from the last two values in a trend array */
function computeGrowth(trends) {
  const calc = arr => {
    const last = arr[arr.length - 1] || 0
    const prev = arr[arr.length - 2] || 0
    if (!prev) return null
    return `${((last - prev) / prev * 100).toFixed(1)}%`
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

/** Build county and state leaderboard tables from all location rows */
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
        const next  = arr[i + 1]?.[1] || count
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

/** Scale dummy county map positions to real total counts */
function buildCountyMap(countyCounts, total) {
  const norm      = s => s.toLowerCase().replace(/\s*county\s*/i, '').trim()
  const dummyTot  = DUMMY_DATA.countyMap.reduce((s, c) => s + c.count, 0) || 1
  const scale     = total > 0 ? total / dummyTot : 1

  if (Object.keys(countyCounts).length === 0) {
    return DUMMY_DATA.countyMap.map(c => ({ ...c, count: Math.round(c.count * scale) }))
  }
  return DUMMY_DATA.countyMap.map(c => {
    const realKey = Object.keys(countyCounts).find(k => norm(k) === norm(c.name))
    return { ...c, count: realKey ? countyCounts[realKey] : 0 }
  })
}

/** Build group-level breakdown metrics from all four grouped row sets */
function buildGroupMetrics({ hbRows, gaRows, npRows, repRows }) {
  return {
    homebuyers: {
      byTimeline:      countBy(hbRows,  'timeline'),
      byFirstTime:     countBy(hbRows,  'first_time'),
      byHousingStatus: countBy(hbRows,  'housing_status'),
      byInterests:     countBy(hbRows,  'interests'),
      byHouseholdSize: bucketHouseholdSize(hbRows),
    },
    realEstatePros: {
      byProfession: countBy(repRows, 'profession'),
      byExperience: bucketExperience(repRows),
      byInterests:  countBy(repRows, 'interests'),
    },
    govAgencies: {
      byAgencyType:    countBy(gaRows, 'agency_type'),
      byFamiliarity:   countBy(gaRows, 'familiarity'),
      byPilotInterest: countBy(gaRows, 'pilot_interest'),
    },
    nonprofits: {
      byMissionArea: countBy(npRows, 'mission_area'),
      byInterests:   countBy(npRows, 'interests'),
    },
  }
}

/** Build the recent activity feed from the latest rows across all tables */
function buildRecentActivity(allRowsWithTable) {
  return allRowsWithTable
    .filter(r => r._date)
    .sort((a, b) => b._date - a._date)
    .slice(0, 20)
    .map(row => {
      const tableKey  = row._table
      const groupKey  = TABLE_KPI_KEY[tableKey] || 'homebuyers'
      const iconKey   = ICON_KEY_MAP[tableKey]  || 'home'
      const type      = TYPE_MAP[tableKey]      || 'new'
      const label     = AUDIENCE_LABEL[tableKey] || 'A stakeholder'
      const state     = row.state ? ` from ${row.state}` : ''

      const diffMs  = Date.now() - row._date.getTime()
      const diffMin = Math.floor(diffMs / 60_000)
      const diffHr  = Math.floor(diffMin / 60)
      const time    = diffMin < 1  ? 'just now'
        : diffMin < 60 ? `${diffMin}m ago`
        : diffHr  < 24 ? `${diffHr}h ago`
        : `${Math.floor(diffHr / 24)}d ago`

      return {
        desc:     `${label}${state} joined the interest list`,
        name:     row.full_name || row.contact_name || row.agency_name || row.organization_name || 'Someone',
        time,
        iconKey,
        groupKey,
        type,
      }
    })
}

// ── Main data fetcher ─────────────────────────────────────────────────────────
async function fetchAllData() {
  // ── 1. COUNT each table ────────────────────────────────────────────────────
  const [hbCount, gaCount, npCount, repCount] = await Promise.all([
    safeCount('future_homebuyers'),
    safeCount('government_agencies'),
    safeCount('nonprofits'),
    safeCount('real_estate_professionals'),
  ])

  const allNull = [hbCount, gaCount, npCount, repCount].every(v => v === null)
  if (allNull) return null   // triggers fallback to dummy data

  const hb    = hbCount  ?? 0
  const ga    = gaCount  ?? 0
  const np    = npCount  ?? 0
  const rep   = repCount ?? 0
  const total = hb + ga + np + rep

  // ── 2. Fetch rows needed for trends + location + group metrics ─────────────
  const [hbRows, gaRows, npRows, repRows] = await Promise.all([
    safeSelect('future_homebuyers',
      'created_at, state, county, timeline, first_time, household_size, housing_status, interests',
      { limit: TREND_ROW_LIMIT }),
    safeSelect('government_agencies',
      'created_at, state, county, agency_type, familiarity, pilot_interest',
      { limit: TREND_ROW_LIMIT }),
    safeSelect('nonprofits',
      'created_at, state, county, mission_area, interests',
      { limit: TREND_ROW_LIMIT }),
    safeSelect('real_estate_professionals',
      'created_at, state, county, profession, experience, interests',
      { limit: TREND_ROW_LIMIT }),
  ])

  // Attach parsed Date objects to each row
  const withDate = (rows, table) =>
    (rows || []).map(r => ({
      ...r,
      _table: table,
      _date:  r.created_at ? new Date(r.created_at) : null,
    }))

  const hbDated  = withDate(hbRows,  'future_homebuyers')
  const gaDated  = withDate(gaRows,  'government_agencies')
  const npDated  = withDate(npRows,  'nonprofits')
  const repDated = withDate(repRows, 'real_estate_professionals')

  // ── 3. Fetch recent activity rows (name, email, created_at) ────────────────
  const [hbAct, gaAct, npAct, repAct] = await Promise.all([
    safeSelect('future_homebuyers',   'created_at, full_name, state',
      { limit: ACTIVITY_LIMIT, orderBy: 'created_at' }),
    safeSelect('government_agencies', 'created_at, agency_name, contact_name, state',
      { limit: ACTIVITY_LIMIT, orderBy: 'created_at' }),
    safeSelect('nonprofits',          'created_at, organization_name, contact_name, state',
      { limit: ACTIVITY_LIMIT, orderBy: 'created_at' }),
    safeSelect('real_estate_professionals', 'created_at, full_name, state',
      { limit: ACTIVITY_LIMIT, orderBy: 'created_at' }),
  ])

  const activityRows = [
    ...withDate(hbAct,  'future_homebuyers'),
    ...withDate(gaAct,  'government_agencies'),
    ...withDate(npAct,  'nonprofits'),
    ...withDate(repAct, 'real_estate_professionals'),
  ]

  // ── 4. Aggregate ───────────────────────────────────────────────────────────
  const groupedRows = {
    homebuyers:    hbDated,
    govAgencies:   gaDated,
    nonprofits:    npDated,
    realEstatePros: repDated,
  }

  const trends       = buildMonthlyTrends(groupedRows)
  const sparklines   = buildSparklines(trends)
  const growth       = computeGrowth(trends)

  const allLocationRows = [...hbDated, ...gaDated, ...npDated, ...repDated]
  const { counties, states, countyCounts } = buildLocationTables(allLocationRows)
  const countyMap    = buildCountyMap(countyCounts, total)

  const groupMetrics   = buildGroupMetrics({ hbRows: hbDated, gaRows: gaDated, npRows: npDated, repRows: repDated })
  const recentActivity = buildRecentActivity(activityRows)

  return {
    kpis: { totalInterests: total, homebuyers: hb, govAgencies: ga, nonprofits: np, realEstatePros: rep },
    sparklines,
    trends,
    growth,
    counties:  counties.length  > 0 ? counties  : DUMMY_DATA.counties,
    states:    states.length    > 0 ? states    : DUMMY_DATA.states,
    countyMap: countyMap.length > 0 ? countyMap : DUMMY_DATA.countyMap,
    groupMetrics,
    recentActivity,
  }
}

// ── Public hook ───────────────────────────────────────────────────────────────
export function useSupabaseData() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [isLive, setIsLive]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAllData()
      if (result) {
        setData(result)
        setIsLive(true)
      } else {
        // Tables not yet created or credentials not set — show demo data
        setData({ ...DUMMY_DATA, groupMetrics: null, recentActivity: [], growth: {} })
        setIsLive(false)
      }
    } catch (err) {
      console.error('[useSupabaseData]', err)
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
