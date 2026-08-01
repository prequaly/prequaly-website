import { useState, useMemo, useEffect, useRef } from 'react'
import { useSupabaseData } from '../hooks/useSupabaseData'
import KPICard from '../components/KPICard'
import MapView from '../components/MapView'
import TrendsChart from '../components/TrendsChart'
import SegmentChart from '../components/SegmentChart'
import TopCountiesTable from '../components/TopCountiesTable'
import InfoIcon from '../components/InfoIcon'
import BreakdownCard from '../components/BreakdownCard'
import Chart from 'chart.js/auto'

// ── Group filter config ───────────────────────────────────────────────────────
const GROUP_TABS = [
  {
    id:       'all',
    label:    'All Groups',
    color:    '#4FAFB0',
    kpiKey:   null,
    icon: <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 5a7 7 0 1 1 14 0H4z"/></svg>,
  },
  {
    id:       'homebuyers',
    label:    'Homebuyers',
    color:    '#4FAFB0',
    kpiKey:   'homebuyers',
    trendKey: 'homebuyers',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10L10 3l7 7"/><path d="M5 8v9h4v-4h2v4h4V8"/></svg>,
  },
  {
    id:       'govAgencies',
    label:    'Gov. Agencies',
    color:    '#3b82f6',
    kpiKey:   'govAgencies',
    trendKey: 'agencies',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="8" width="16" height="10" rx="1"/><path d="M10 2l8 6H2z"/></svg>,
  },
  {
    id:       'nonprofits',
    label:    'Nonprofits',
    color:    '#8b5cf6',
    kpiKey:   'nonprofits',
    trendKey: 'nonprofits',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 16S2 11 2 6a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10z"/></svg>,
  },
  {
    id:       'realEstatePros',
    label:    'Real Estate Pros',
    color:    '#f59e0b',
    kpiKey:   'realEstatePros',
    trendKey: 'realEstate',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="9" r="5"/><path d="M13 14l5 5"/></svg>,
  },
]

// ── Group Filter Tabs ─────────────────────────────────────────────────────────
function GroupFilterTabs({ activeGroup, onGroupChange, kpis }) {
  return (
    <div className="group-filter-bar">
      <div className="group-filter-label">View by group:</div>
      <div className="group-filter-tabs">
        {GROUP_TABS.map(tab => {
          const count = tab.kpiKey ? (kpis?.[tab.kpiKey] ?? '…') : (kpis?.totalInterests ?? '…')
          const isActive = activeGroup === tab.id
          return (
            <button
              key={tab.id}
              className={`group-tab ${isActive ? 'group-tab-active' : ''}`}
              style={isActive ? { '--tab-color': tab.color, borderColor: tab.color, color: tab.color } : {}}
              onClick={() => onGroupChange(tab.id)}
            >
              <span className="group-tab-icon" style={isActive ? { color: tab.color } : {}}>
                {tab.icon}
              </span>
              <span className="group-tab-label">{tab.label}</span>
              <span
                className="group-tab-count"
                style={isActive ? { background: tab.color + '22', color: tab.color } : {}}
              >
                {typeof count === 'number' ? count.toLocaleString() : count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Data Source Banner ────────────────────────────────────────────────────────
function DataBanner({ isLive, error, onRefetch }) {
  if (isLive) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', marginBottom: 16, borderRadius: 8,
        background: 'rgba(31,185,128,0.08)', border: '1px solid rgba(31,185,128,0.25)',
        fontSize: 12, color: '#1FB980', fontWeight: 600,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#1FB980',
          display: 'inline-block', flexShrink: 0,
        }} />
        Live — Supabase · Auto-refreshing every 60s
        <button
          onClick={onRefetch}
          style={{
            marginLeft: 'auto', fontSize: 11, color: '#1FB980',
            background: 'none', border: '1px solid rgba(31,185,128,0.35)',
            cursor: 'pointer', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            fontFamily: 'inherit',
          }}
        >
          Refresh now
        </button>
      </div>
    )
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 14px', marginBottom: 16, borderRadius: 8,
      background: 'rgba(148,163,184,0.07)', border: '1px solid rgba(148,163,184,0.2)',
      fontSize: 12, color: 'var(--slate-500)', fontWeight: 500,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: 'var(--slate-300)',
        display: 'inline-block', flexShrink: 0,
      }} />
      {error
        ? `⚠ Could not connect to Supabase — showing demo data (${error})`
        : 'Showing demo data — configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect live data'}
    </div>
  )
}

// ── Stakeholder interest bars ────────────────────────────────────────────────
const SBAR_ITEMS = [
  { key: 'homebuyers',     label: 'Homebuyers',              color: '#4FAFB0' },
  { key: 'realEstatePros', label: 'Real Estate Professionals', color: '#f59e0b' },
  { key: 'govAgencies',    label: 'Gov. Agencies',            color: '#3b82f6' },
  { key: 'nonprofits',     label: 'Nonprofits',               color: '#8b5cf6' },
]

function StakeholderBars({ kpis }) {
  if (!kpis) return null
  const total = SBAR_ITEMS.reduce((s, it) => s + (kpis[it.key] || 0), 0) || 1

  return (
    <div className="card" style={{ animationDelay: '150ms' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            Interest by Stakeholder
            <InfoIcon text="Compares the volume of interest across each stakeholder group, showing their proportional share of total platform engagement." />
          </div>
        </div>
      </div>
      <div className="stakeholder-bars">
        {SBAR_ITEMS.map(({ key, label, color }) => {
          const val = kpis[key] || 0
          const pct = ((val / total) * 100).toFixed(1)
          return (
            <div key={key} className="sbar-item">
              <div className="sbar-header">
                <div className="sbar-label">
                  <span className="sbar-dot" style={{ background: color }} />
                  {label}
                </div>
                <div>
                  <span className="sbar-val">{val.toLocaleString()}</span>
                  <span className="sbar-pct">({pct}%)</span>
                </div>
              </div>
              <div className="sbar-track">
                <div className="sbar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Activity icons ────────────────────────────────────────────────────────────
const ACTIVITY_ICONS = {
  home:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}><path d="M3 10L10 3l7 7"/><path d="M5 8v9h4v-4h2v4h4V8"/></svg>,
  agency: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}><rect x="2" y="8" width="16" height="10" rx="1"/><path d="M10 2l8 6H2z"/></svg>,
  np:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}><path d="M10 16S2 11 2 6a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10z"/></svg>,
  pro:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}><circle cx="8" cy="9" r="5"/><path d="M13 14l5 5"/></svg>,
  doc:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}><rect x="4" y="2" width="12" height="16" rx="2"/><path d="M7 7h6M7 10h6M7 13h4"/></svg>,
}

// Static fallback activity data (used when no live data is available)
const ACTIVITY_BY_GROUP = {
  all: [
    { desc: 'A homebuyer just signed up!',                    time: '2m ago',  type: 'new',    iconKey: 'home'   },
    { desc: 'A government agency expressed interest',         time: '15m ago', type: 'agency', iconKey: 'agency' },
    { desc: 'A nonprofit submitted a grant program inquiry',  time: '1h ago',  type: 'np',     iconKey: 'np'     },
    { desc: 'A real estate professional joined the platform', time: '2h ago',  type: 'pro',    iconKey: 'pro'    },
    { desc: 'An organization registered for updates',         time: '3h ago',  type: 'agency', iconKey: 'agency' },
    { desc: 'A homebuyer requested affordability info',       time: '4h ago',  type: 'new',    iconKey: 'home'   },
  ],
  homebuyers: [
    { desc: 'A homebuyer just signed up!',                     time: '2m ago',  iconKey: 'home' },
    { desc: 'A homebuyer requested affordability info',        time: '18m ago', iconKey: 'home' },
    { desc: 'A homebuyer completed the prequalification form', time: '45m ago', iconKey: 'home' },
    { desc: 'A homebuyer downloaded the housing guide',        time: '1h ago',  iconKey: 'doc'  },
    { desc: 'A homebuyer scheduled a consultation',            time: '2h ago',  iconKey: 'doc'  },
    { desc: 'A homebuyer submitted income documentation',      time: '3h ago',  iconKey: 'home' },
  ],
  govAgencies: [
    { desc: 'A government agency expressed program interest',  time: '15m ago', iconKey: 'agency' },
    { desc: 'An agency requested a partnership briefing',      time: '1h ago',  iconKey: 'agency' },
    { desc: 'An agency downloaded the policy framework',       time: '2h ago',  iconKey: 'doc'    },
    { desc: 'A city housing office registered for updates',    time: '3h ago',  iconKey: 'agency' },
    { desc: 'An agency submitted a data-sharing request',      time: '4h ago',  iconKey: 'doc'    },
    { desc: 'A county housing authority joined the platform',  time: '5h ago',  iconKey: 'agency' },
  ],
  nonprofits: [
    { desc: 'A nonprofit submitted a grant inquiry',           time: '1h ago',  iconKey: 'np'  },
    { desc: 'An organization registered for program updates',  time: '2h ago',  iconKey: 'np'  },
    { desc: 'A nonprofit requested a partnership meeting',     time: '3h ago',  iconKey: 'np'  },
    { desc: 'An org downloaded the nonprofit resource guide',  time: '4h ago',  iconKey: 'doc' },
    { desc: 'A housing nonprofit signed up for alerts',        time: '5h ago',  iconKey: 'np'  },
    { desc: 'A nonprofit completed the eligibility survey',    time: '6h ago',  iconKey: 'doc' },
  ],
  realEstatePros: [
    { desc: 'A real estate professional joined the platform',  time: '2h ago',  iconKey: 'pro' },
    { desc: 'An agent requested client referral access',       time: '3h ago',  iconKey: 'pro' },
    { desc: 'A broker downloaded the pro resources pack',      time: '4h ago',  iconKey: 'doc' },
    { desc: 'A real estate pro submitted a listing inquiry',   time: '5h ago',  iconKey: 'pro' },
    { desc: 'An agent signed up for market update alerts',     time: '6h ago',  iconKey: 'pro' },
    { desc: 'A realtor completed the platform onboarding',     time: '7h ago',  iconKey: 'pro' },
  ],
}

const BADGE_CLASS = { new: 'badge-new', agency: 'badge-agency', np: 'badge-np', pro: 'badge-pro' }
const BADGE_LABEL = { new: 'New', agency: 'Agency', np: 'Nonprofit', pro: 'Pro' }

function ActivityFeedItems({ items }) {
  return items.map((item, i) => (
    <div key={i} className="activity-item">
      <div className="activity-icon" style={{ background: 'rgba(79,175,176,0.1)', color: 'var(--teal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }}>
        {ACTIVITY_ICONS[item.iconKey]}
      </div>
      <div className="activity-body">
        <div className="activity-desc" style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: 13 }}>{item.desc}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span className="activity-time">{item.time}</span>
        {item.type && (
          <span className={`activity-badge ${BADGE_CLASS[item.type] || 'badge-new'}`}>
            {BADGE_LABEL[item.type] || 'New'}
          </span>
        )}
      </div>
    </div>
  ))
}

/**
 * RecentActivity
 * Shows live form submissions when available (liveItems), otherwise falls
 * back to static demo entries filtered by activeGroup.
 */
function RecentActivity({ activeGroup, liveItems }) {
  const [modalOpen, setModalOpen] = useState(false)

  const items = useMemo(() => {
    if (liveItems && liveItems.length > 0) {
      if (activeGroup === 'all') return liveItems.slice(0, 6)
      return liveItems.filter(i => i.groupKey === activeGroup).slice(0, 6)
    }
    return ACTIVITY_BY_GROUP[activeGroup] || ACTIVITY_BY_GROUP.all
  }, [liveItems, activeGroup])

  const allModalItems = useMemo(() => {
    if (liveItems && liveItems.length > 0) {
      if (activeGroup === 'all') return liveItems
      return liveItems.filter(i => i.groupKey === activeGroup)
    }
    return ACTIVITY_BY_GROUP[activeGroup] || ACTIVITY_BY_GROUP.all
  }, [liveItems, activeGroup])

  return (
    <>
      <div className="card" style={{ animationDelay: '200ms' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              Recent Interest Activity
              <InfoIcon text="A live feed of the most recent stakeholder form submissions, ordered by submission time." />
            </div>
          </div>
          <button className="card-action" onClick={() => setModalOpen(true)}>View all</button>
        </div>
        <div className="activity-list">
          <ActivityFeedItems items={items} />
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Recent Interest Activity</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <path d="M5 5l10 10M15 5L5 15"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <ActivityFeedItems items={allModalItems} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Mini trends line chart ────────────────────────────────────────────────────
function MiniTrendsChart({ label, data, color, labels }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return
    if (chartRef.current) chartRef.current.destroy()
    const ctx = canvasRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 200)
    gradient.addColorStop(0, color + '44')
    gradient.addColorStop(1, color + '00')
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: labels || ['Nov','Dec','Jan','Feb','Mar','Apr','May'],
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          tension: 0.45,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16212B',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'Inter', size: 12 },
            titleColor: '#ffffff',
            bodyColor: '#94a3b8',
            padding: 12,
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}` },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, callback: v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
            border: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
            border: { display: false },
          },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [data, color, label, labels])

  return (
    <div className="card" style={{ animationDelay: '150ms' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            {label} Trend
            <InfoIcon text="Tracks monthly registration volume for this stakeholder group over the past several months." />
          </div>
          <div className="card-subtitle">Monthly registrations</div>
        </div>
      </div>
      <div className="chart-body chart-body-lg" style={{ paddingTop: 8 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// ── Mini doughnut — share of total ───────────────────────────────────────────
function MiniSegmentChart({ kpis, highlightKey, highlightLabel, color }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !kpis) return
    if (chartRef.current) chartRef.current.destroy()
    const val   = kpis[highlightKey] || 0
    const other = (kpis.totalInterests || 1) - val
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: [highlightLabel, 'Other'],
        datasets: [{
          data: [val, other],
          backgroundColor: [color, '#e2e8f0'],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16212B',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'Inter', size: 12 },
            titleColor: '#ffffff',
            bodyColor: '#94a3b8',
            padding: 12,
          },
        },
      },
      plugins: [{
        id: 'centerText',
        afterDraw(chart) {
          const { ctx, chartArea: { left, top, right, bottom } } = chart
          const cx = (left + right) / 2
          const cy = (top + bottom) / 2
          const v2 = kpis[highlightKey] || 0
          const total = kpis.totalInterests || 1
          const pct = ((v2 / total) * 100).toFixed(1)
          ctx.save()
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = "800 22px 'Manrope', sans-serif"
          ctx.fillStyle = '#16212B'
          ctx.fillText(`${pct}%`, cx, cy - 7)
          ctx.font = "500 10px 'Inter', sans-serif"
          ctx.fillStyle = '#94a3b8'
          ctx.fillText('of all interests', cx, cy + 11)
          ctx.restore()
        },
      }],
    })
    return () => chartRef.current?.destroy()
  }, [kpis, highlightKey, highlightLabel, color])

  if (!kpis) return null
  const val   = kpis[highlightKey] || 0
  const total = kpis.totalInterests || 1

  return (
    <div className="card" style={{ animationDelay: '200ms' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            Share of Total Interest
            <InfoIcon text="Shows what percentage of all platform interest belongs to this stakeholder group compared to the combined total." />
          </div>
        </div>
      </div>
      <div className="chart-body">
        <canvas ref={canvasRef} />
      </div>
      <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: highlightLabel, v: val,         color },
          { label: 'All Others',   v: total - val, color: '#e2e8f0' },
        ].map(({ label, v, color: c }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--slate-600)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0, display: 'inline-block' }} />
              {label}
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy-900)' }}>
              {v.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Group config ──────────────────────────────────────────────────────────────
const GROUP_CONFIG = {
  homebuyers: {
    label:     'Homebuyers',
    kpiKey:    'homebuyers',
    trendKey:  'homebuyers',
    color:     '#4FAFB0',
    iconClass: 'blue',
    // Fallback growth used when no prior-month data available
    growthFallback: '14.8%',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10L10 3l7 7"/><path d="M5 8v9h4v-4h2v4h4V8"/></svg>,
  },
  govAgencies: {
    label:     'Government Agencies',
    kpiKey:    'govAgencies',
    trendKey:  'agencies',
    color:     '#3b82f6',
    iconClass: 'purple',
    growthFallback: '8.6%',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="8" width="16" height="10" rx="1"/><path d="M10 2l8 6H2z"/></svg>,
  },
  nonprofits: {
    label:     'Nonprofits',
    kpiKey:    'nonprofits',
    trendKey:  'nonprofits',
    color:     '#8b5cf6',
    iconClass: 'rose',
    growthFallback: '10.2%',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 16S2 11 2 6a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10z"/></svg>,
  },
  realEstatePros: {
    label:     'Real Estate Professionals',
    kpiKey:    'realEstatePros',
    trendKey:  'realEstate',
    color:     '#f59e0b',
    iconClass: 'amber',
    growthFallback: '13.1%',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="9" r="5"/><path d="M13 14l5 5"/></svg>,
  },
}

// ── Group-specific breakdown cards ───────────────────────────────────────────
function GroupBreakdownCards({ groupId, gm, cfg }) {
  if (!gm) return null

  const cardDefs = {
    homebuyers: [
      {
        title: 'Purchase Timeline',
        infoText: 'When homebuyers on the interest list plan to purchase — shows demand urgency.',
        items: gm.byTimeline,
      },
      {
        title: 'First-Time Buyer?',
        infoText: 'Breakdown of first-time versus experienced homebuyers in your interest list.',
        items: gm.byFirstTime,
      },
      {
        title: 'Housing Status',
        infoText: 'Current housing situation of interested homebuyers — renters, family-living, or owners.',
        items: gm.byHousingStatus,
      },
      {
        title: 'Top Interests',
        infoText: 'The programs and services homebuyers are most interested in.',
        items: gm.byInterests,
      },
    ],
    realEstatePros: [
      {
        title: 'Profession Type',
        infoText: 'Breakdown of professional roles among real estate pros on the interest list.',
        items: gm.byProfession,
      },
      {
        title: 'Years of Experience',
        infoText: 'Distribution of experience levels among real estate professionals.',
        items: gm.byExperience,
      },
      {
        title: 'Partnership Interests',
        infoText: 'What real estate professionals are most interested in collaborating on.',
        items: gm.byInterests,
      },
    ],
    govAgencies: [
      {
        title: 'Agency Type',
        infoText: 'Types of government agencies that have expressed interest in PreQualy.',
        items: gm.byAgencyType,
      },
      {
        title: 'Program Familiarity',
        infoText: 'How familiar agencies are with homeownership programs — indicates readiness for coordination.',
        items: gm.byFamiliarity,
      },
      {
        title: 'Pilot Interest',
        infoText: 'Level of interest in pilot collaboration among government agencies.',
        items: gm.byPilotInterest,
      },
    ],
    nonprofits: [
      {
        title: 'Mission Area',
        infoText: 'Primary mission areas of nonprofit organizations on the interest list.',
        items: gm.byMissionArea,
      },
      {
        title: 'Partnership Interests',
        infoText: 'Types of partnerships nonprofits are most interested in with PreQualy.',
        items: gm.byInterests,
      },
    ],
  }

  const cards = cardDefs[groupId] || []
  if (cards.length === 0) return null

  const cols = Math.min(cards.length, 3)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--slate-400)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
      }}>
        Group Insights
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {cards.map(({ title, infoText, items }, idx) => (
          <BreakdownCard
            key={title}
            title={title}
            infoText={infoText}
            items={items}
            color={cfg.color}
            delay={idx * 50}
          />
        ))}
      </div>
    </div>
  )
}

// ── Single-group focused dashboard ───────────────────────────────────────────
function GroupDashboard({ groupId, dashData, groupMetrics, growth }) {
  const cfg = GROUP_CONFIG[groupId]
  if (!cfg || !dashData) return null

  const kpis    = dashData.kpis      || {}
  const sparks  = dashData.sparklines || {}
  const trends  = dashData.trends    || {}
  const val     = kpis[cfg.kpiKey]   || 0
  const sparkKey   = cfg.kpiKey === 'realEstatePros' ? 'realEstate' : cfg.kpiKey
  const sparkData  = sparks[sparkKey]     || []
  const trendData  = trends[cfg.trendKey] || []
  const sharePct   = (((val) / (kpis.totalInterests || 1)) * 100).toFixed(1)
  const gm         = groupMetrics?.[groupId] || null

  // Use computed growth if available, otherwise fall back to static value
  const groupGrowth = growth?.[cfg.kpiKey] ?? cfg.growthFallback
  const totalGrowth = growth?.total        ?? '12.4%'

  return (
    <>
      {/* Row 1: 3 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPICard
          label={cfg.label}
          value={val}
          growth={groupGrowth || null}
          positive
          iconClass={cfg.iconClass}
          icon={cfg.icon}
          sparkline={sparkData}
          sparkColor={cfg.color}
          delay={0}
        />
        <KPICard
          label="Total Interests (Platform)"
          value={kpis.totalInterests}
          growth={totalGrowth || null}
          positive
          iconClass="teal"
          icon={<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 5a7 7 0 1 1 14 0H4z"/></svg>}
          sparkline={sparks.total}
          sparkColor="#4FAFB0"
          delay={50}
        />
        <KPICard
          label="Share of All Interests"
          value={`${sharePct}%`}
          iconClass="purple"
          icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2z"/><path d="M10 10 L10 5 A5 5 0 0 1 15 10Z" fill="currentColor" stroke="none" opacity=".6"/></svg>}
          delay={100}
        />
      </div>

      {/* Group Insights — breakdown cards for this group's unique fields */}
      <GroupBreakdownCards groupId={groupId} gm={gm} cfg={cfg} />

      <div className="dashboard-grid">
        {/* Map + Donut */}
        <div className="grid-row grid-row-map">
          <MapView counties={dashData?.counties} states={dashData?.states} />
          <MiniSegmentChart
            kpis={kpis}
            highlightKey={cfg.kpiKey}
            highlightLabel={cfg.label}
            color={cfg.color}
          />
        </div>

        {/* Trend line + Activity feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
          <MiniTrendsChart
            label={cfg.label}
            data={trendData}
            color={cfg.color}
            labels={trends.labels}
          />
          <RecentActivity activeGroup={groupId} liveItems={dashData.recentActivity} />
        </div>

        {/* Counties / States table */}
        <TopCountiesTable counties={dashData.counties} states={dashData.states} />
      </div>
    </>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ activePage, activeGroup, onGroupChange }) {
  const { data: dashData, loading, error, isLive, refetch } = useSupabaseData()

  if (loading) {
    return (
      <div className="loading-area" style={{ paddingTop: 80 }}>
        <div className="spinner" /> Loading dashboard data…
      </div>
    )
  }

  if (activePage !== 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚧</div>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--navy-900)' }}>{activePage}</h2>
      </div>
    )
  }

  const kpis   = dashData?.kpis      || {}
  const sparks = dashData?.sparklines || {}
  const growth = dashData?.growth     || {}

  return (
    <div className="page-content">
      {/* ── Data source banner ── */}
      <DataBanner isLive={isLive} error={error} onRefetch={refetch} />

      {/* ── Group filter tabs ── */}
      <GroupFilterTabs
        activeGroup={activeGroup}
        onGroupChange={onGroupChange}
        kpis={kpis}
      />

      {/* ── Focused group dashboard OR all-groups overview ── */}
      {activeGroup !== 'all' ? (
        <GroupDashboard
          groupId={activeGroup}
          dashData={dashData}
          groupMetrics={dashData?.groupMetrics}
          growth={growth}
        />
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="kpi-grid">
            <KPICard
              label="Total Interests"
              value={kpis.totalInterests}
              growth={growth.total || null}
              positive iconClass="teal"
              icon={<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 5a7 7 0 1 1 14 0H4z"/></svg>}
              sparkline={sparks.total}
              sparkColor="#4FAFB0"
              delay={0}
            />
            <KPICard
              label="Homebuyers"
              value={kpis.homebuyers}
              growth={growth.homebuyers || null}
              positive iconClass="blue"
              icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10L10 3l7 7"/><path d="M5 8v9h4v-4h2v4h4V8"/></svg>}
              sparkline={sparks.homebuyers}
              sparkColor="#3b82f6"
              delay={50}
            />
            <KPICard
              label="Gov. Agencies"
              value={kpis.govAgencies}
              growth={growth.govAgencies || null}
              positive iconClass="purple"
              icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="8" width="16" height="10" rx="1"/><path d="M10 2l8 6H2z"/></svg>}
              sparkline={sparks.govAgencies}
              sparkColor="#8b5cf6"
              delay={100}
            />
            <KPICard
              label="Nonprofits"
              value={kpis.nonprofits}
              growth={growth.nonprofits || null}
              positive iconClass="rose"
              icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 16S2 11 2 6a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10z"/></svg>}
              sparkline={sparks.nonprofits}
              sparkColor="#f43f5e"
              delay={150}
            />
            <KPICard
              label="Real Estate Pros"
              value={kpis.realEstatePros}
              growth={growth.realEstatePros || null}
              positive iconClass="amber"
              icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="9" r="5"/><path d="M13 14l5 5"/></svg>}
              sparkline={sparks.realEstate}
              sparkColor="#f59e0b"
              delay={200}
            />
          </div>

          <div className="dashboard-grid">
            {/* Map + Segment chart */}
            <div className="grid-row grid-row-map">
              <MapView counties={dashData?.counties} states={dashData?.states} />
              <SegmentChart kpis={kpis} />
            </div>

            {/* Trends (full width) */}
            <TrendsChart data={dashData?.trends} />

            {/* Bottom widgets */}
            <div className="grid-row grid-row-bottom">
              <TopCountiesTable counties={dashData?.counties} states={dashData?.states} />
              <StakeholderBars kpis={kpis} />
              <RecentActivity activeGroup="all" liveItems={dashData?.recentActivity} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
