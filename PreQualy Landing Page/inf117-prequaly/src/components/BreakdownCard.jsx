/**
 * BreakdownCard
 * Displays a compact card with a title and a horizontal bar chart of
 * categorical distribution data (e.g. "Purchase Timeline: Within 6 months — 14").
 *
 * Props:
 *   title      {string}          Card heading
 *   infoText   {string}          Tooltip text for the InfoIcon
 *   items      {[string,number][]} Sorted array of [label, count] pairs
 *   color      {string}          Bar fill color (hex)
 *   delay      {number}          CSS animation delay in ms
 *   emptyText  {string}          Text shown when items is empty
 */
import InfoIcon from './InfoIcon'

export default function BreakdownCard({
  title,
  infoText,
  items = [],
  color = '#4FAFB0',
  delay = 0,
  emptyText = 'No submissions yet',
}) {
  const top = items.slice(0, 5)
  const maxCount = top[0]?.[1] || 1

  return (
    <div className="card" style={{ animationDelay: `${delay}ms` }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            {title}
            {infoText && <InfoIcon text={infoText} />}
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 20px 18px' }}>
        {top.length === 0 ? (
          <div style={{
            color: 'var(--slate-400)',
            fontSize: 12,
            textAlign: 'center',
            padding: '18px 0',
            fontStyle: 'italic',
          }}>
            {emptyText}
          </div>
        ) : (
          top.map(([label, count]) => {
            const pct = Math.max(4, Math.round((count / maxCount) * 100))
            return (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontSize: 12,
                    color: 'var(--navy-800)',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    maxWidth: '75%',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: 'var(--slate-500)',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {count.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: 'var(--slate-100)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    borderRadius: 3,
                    transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
