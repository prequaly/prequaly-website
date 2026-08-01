import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import InfoIcon from './InfoIcon'

export default function TrendsChart({ data }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return

    if (chartRef.current) chartRef.current.destroy()

    const ctx = canvasRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 220)
    gradient.addColorStop(0, 'rgba(79,175,176,0.22)')
    gradient.addColorStop(1, 'rgba(79,175,176,0)')

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Homebuyers',
            data: data.homebuyers,
            borderColor: '#4FAFB0',
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.45,
            fill: true,
          },
          {
            label: 'Gov. Agencies',
            data: data.agencies,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.45,
            fill: false,
          },
          {
            label: 'Nonprofits',
            data: data.nonprofits,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.45,
            fill: false,
          },
          {
            label: 'Real Estate',
            data: data.realEstate,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.45,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              font: { family: 'Inter', size: 11 },
              color: '#94a3b8',
              usePointStyle: true,
              pointStyleWidth: 8,
              padding: 16,
              boxHeight: 6,
            },
          },
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
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
              callback: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v,
            },
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

    return () => { chartRef.current?.destroy() }
  }, [data])

  return (
    <div className="card" style={{ animationDelay: '150ms' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            Interest Trend
            <InfoIcon text="Plots monthly interest volume across all stakeholder groups over time, making it easy to compare growth trajectories and spot seasonal patterns." />
          </div>
          <div className="card-subtitle">All categories · Monthly</div>
        </div>
        <select style={{ fontSize: 12, border: '1px solid var(--slate-200)', borderRadius: 6, padding: '4px 8px', color: 'var(--slate-500)', background: 'var(--fog-100)', cursor: 'pointer' }}>
          <option>Monthly</option>
          <option>Weekly</option>
          <option>Daily</option>
        </select>
      </div>
      <div className="chart-body chart-body-lg" style={{ paddingTop: 8 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
