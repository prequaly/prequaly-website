function LocationIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6z"/>
      <circle cx="10" cy="8" r="2"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="16" height="14" rx="2"/>
      <path d="M6 2v4M14 2v4M2 9h16"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v11M5 9l5 5 5-5"/>
      <path d="M2 17h16"/>
    </svg>
  )
}

export default function TopBar({ onExportReport }) {
  return (
    <header className="topbar">
      {/* Title only — no subtitle, no extra elements */}
      <div className="topbar-left">
        <h1>Welcome back, Admin</h1>
      </div>

      {/* Controls — all same height, aligned */}
      <div className="topbar-right">
        <button className="topbar-control">
          <LocationIcon />
          California
          <span className="topbar-chevron">▾</span>
        </button>

        <button className="topbar-control">
          <CalendarIcon />
          May 1 – May 31, 2024
          <span className="topbar-chevron">▾</span>
        </button>

        <button className="topbar-control topbar-control-primary" onClick={onExportReport}>
          <DownloadIcon />
          Export Report
        </button>
      </div>
    </header>
  )
}
