// DataSourceBadge — shows whether data is coming from Supabase, a CSV, or demo mode
export default function DataSourceBadge({ source, filename, onClear }) {
  if (source === 'live') {
    return (
      <span className="ds-badge live">
        <span className="pulse-dot dot-green" />
        Live · Supabase
      </span>
    )
  }
  if (source === 'csv') {
    return (
      <span className="ds-badge csv" style={{ gap: 8 }}>
        <span className="pulse-dot dot-teal" />
        CSV · {filename}
        {onClear && (
          <button
            onClick={onClear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'inherit', padding: '0 0 0 4px', lineHeight: 1 }}
            title="Clear CSV and revert to live data"
          >
            ✕
          </button>
        )}
      </span>
    )
  }
  return (
    <span className="ds-badge demo">
      <span className="pulse-dot dot-amber" />
      Demo data
    </span>
  )
}
