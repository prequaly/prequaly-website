import { useState } from 'react'
import InfoIcon from './InfoIcon'

// Teal intensity scale based on normalized count
function countToTeal(count, maxCount) {
  if (maxCount === 0) return 'rgba(79,175,176,0.15)'
  const ratio = Math.min(count / maxCount, 1)
  // Map 0→1 to a teal opacity range
  if (ratio < 0.15) return 'rgba(79,175,176,0.18)'
  if (ratio < 0.30) return 'rgba(79,175,176,0.32)'
  if (ratio < 0.50) return 'rgba(79,175,176,0.50)'
  if (ratio < 0.70) return 'rgba(79,175,176,0.68)'
  if (ratio < 0.85) return 'rgba(79,175,176,0.82)'
  return 'rgba(79,175,176,0.96)'
}

function countToRadius(count, maxCount) {
  if (maxCount === 0) return 5
  const ratio = Math.min(count / maxCount, 1)
  return 5 + ratio * 14
}

// Simplified California state outline path (SVG viewport 320 x 500)
const CA_PATH = `
  M 50,0 L 278,0 L 278,0
  L 278,78 L 284,120 L 286,160 L 286,200
  L 285,240 L 283,280 L 278,320 L 270,348
  L 255,368 L 240,382 L 230,392 L 222,410
  L 228,424 L 238,436 L 252,446 L 262,456
  L 268,466 L 258,474 L 244,476 L 228,472
  L 214,464 L 204,454 L 196,444 L 186,432
  L 176,418 L 168,402 L 158,384 L 148,364
  L 136,342 L 124,318 L 112,292 L 100,268
  L 88,244 L 76,220 L 64,196 L 52,172
  L 36,148 L 20,136 L 24,108 L 28,82
  L 34,58 L 40,36 L 44,16 Z
`

export default function HeatMapPanel({ countyMap, title = 'CA Interest Heat Map', subtitle = 'County Level' }) {
  const [tooltip, setTooltip] = useState(null) // { x, y, name, count, change }

  const maxCount = countyMap ? Math.max(...countyMap.map(c => c.count), 1) : 1

  const handleMouseEnter = (e, county) => {
    const rect = e.currentTarget.closest('.heatmap-body').getBoundingClientRect()
    const cx = e.currentTarget.getAttribute('cx') * 1
    const cy = e.currentTarget.getAttribute('cy') * 1
    // Convert SVG coords to percentage
    setTooltip({
      xPct: (cx / 320) * 100,
      yPct: (cy / 500) * 100,
      name: county.name,
      count: county.count,
      change: county.delta || '+8.2%',
    })
  }

  return (
    <div className="card" style={{ animationDelay: '100ms' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            {title}
            <InfoIcon text="Displays county-level interest intensity across California using dot sizes and color depth to highlight areas with the highest demand concentration." />
          </div>
          <div className="card-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="heatmap-body" style={{ position: 'relative' }}>
        <div className="heatmap-svg-wrap">
          <svg
            viewBox="0 0 320 500"
            className="ca-map-svg"
            style={{ maxHeight: 280 }}
          >
            {/* State fill */}
            <defs>
              <radialGradient id="ca-bg" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(79,175,176,0.06)" />
                <stop offset="100%" stopColor="rgba(79,175,176,0)" />
              </radialGradient>
            </defs>
            <path
              d={CA_PATH}
              fill="url(#ca-bg)"
              stroke="rgba(79,175,176,0.3)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* County dots */}
            {countyMap && countyMap.map((county, i) => {
              const r    = countToRadius(county.count, maxCount)
              const fill = countToTeal(county.count, maxCount)
              return (
                <g key={county.name}>
                  {/* Glow ring for top counties */}
                  {county.count / maxCount > 0.5 && (
                    <circle
                      cx={county.x} cy={county.y} r={r + 5}
                      fill="rgba(79,175,176,0.12)"
                    />
                  )}
                  <circle
                    className="county-dot"
                    cx={county.x} cy={county.y} r={r}
                    fill={fill}
                    stroke="rgba(79,175,176,0.5)"
                    strokeWidth="1"
                    onMouseEnter={e => handleMouseEnter(e, county)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              )
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="map-tooltip"
            style={{
              left: `${tooltip.xPct}%`,
              top:  `${tooltip.yPct}%`,
            }}
          >
            <div className="map-tooltip-name">{tooltip.name} County</div>
            <div className="map-tooltip-val">{tooltip.count.toLocaleString()}</div>
            <div className="map-tooltip-change">↑ {tooltip.change} vs last month</div>
          </div>
        )}

        {/* Legend */}
        <div className="heatmap-legend">
          <span className="heatmap-legend-label">Low Interest</span>
          <div className="heatmap-legend-bar" />
          <span className="heatmap-legend-label">High Interest</span>
        </div>
      </div>
    </div>
  )
}
