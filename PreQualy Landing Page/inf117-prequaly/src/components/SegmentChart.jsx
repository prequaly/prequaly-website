import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import InfoIcon from './InfoIcon'

const COLORS = ['#4FAFB0', '#3b82f6', '#8b5cf6', '#f43f5e']
const LABELS = ['Homebuyers', 'Real Estate Pros', 'Gov. Agencies', 'Nonprofits']

export default function SegmentChart({ kpis }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !kpis) return
    if (chartRef.current) chartRef.current.destroy()

    const values = [
      kpis.homebuyers,
      kpis.realEstatePros,
      kpis.govAgencies,
      kpis.nonprofits,
    ]
    const total = values.reduce((a, b) => a + b, 0) || 1

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: LABELS,
        datasets: [{
          data: values,
          backgroundColor: COLORS,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 3,
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
            callbacks: {
              label: (ctx) => {
                const pct = ((ctx.parsed / total) * 100).toFixed(1)
                return ` ${ctx.parsed.toLocaleString()} (${pct}%)`
              },
            },
          },
        },
      },
      plugins: [{
        id: 'centerText',
        afterDraw(chart) {
          const { ctx, chartArea: { left, top, right, bottom } } = chart
          const cx = (left + right) / 2
          const cy = (top + bottom) / 2
          ctx.save()
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = "800 22px 'Manrope', sans-serif"
          ctx.fillStyle = '#16212B'
          ctx.fillText(total.toLocaleString(), cx, cy - 7)
          ctx.font = "500 10px 'Inter', sans-serif"
          ctx.fillStyle = '#94a3b8'
          ctx.fillText('Total Interests', cx, cy + 11)
          ctx.restore()
        },
      }],
    })

    return () => chartRef.current?.destroy()
  }, [kpis])

  if (!kpis) return null

  const total = (kpis.homebuyers + kpis.realEstatePros + kpis.govAgencies + kpis.nonprofits) || 1

  return (
    <div className="card" style={{ animationDelay: '200ms' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            Interest by Category
            <InfoIcon text="Breaks down total platform interest into four stakeholder groups, visualizing each group's proportional share as a doughnut chart." />
          </div>
        </div>
      </div>
      <div className="chart-body">
        <canvas ref={canvasRef} />
      </div>
      <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LABELS.map((label, i) => {
          const values = [kpis.homebuyers, kpis.realEstatePros, kpis.govAgencies, kpis.nonprofits]
          const pct = ((values[i] / total) * 100).toFixed(1)
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--slate-600)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0, display: 'inline-block' }} />
                {label}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy-900)' }}>
                  {values[i].toLocaleString()}
                </span>
                <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
