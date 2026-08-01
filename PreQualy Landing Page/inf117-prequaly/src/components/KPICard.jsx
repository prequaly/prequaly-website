// KPICard — stat card with icon, value, growth indicator, and SVG sparkline
function Sparkline({ values, color = '#4FAFB0' }) {
  if (!values || values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 120, H = 36

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return [x, y]
  })

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function KPICard({ label, value, growth, positive, icon, iconClass, sparkline, sparkColor, delay = 0 }) {
  const fmt = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000)    return n.toLocaleString()
    return String(n)
  }

  return (
    <div className="kpi-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-card-top">
        <div className={`kpi-icon ${iconClass}`}>{icon}</div>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{typeof value === 'number' ? fmt(value) : value}</div>
      {growth && (
        <div className={`kpi-growth ${positive ? 'pos' : 'neg'}`}>
          {positive ? '↑' : '↓'} {growth}
          <span style={{ fontWeight: 400, color: 'var(--slate-400)', fontSize: 11 }}> vs last mo</span>
        </div>
      )}
      {sparkline && (
        <div className="kpi-sparkline">
          <Sparkline values={sparkline} color={sparkColor} />
        </div>
      )}
    </div>
  )
}
