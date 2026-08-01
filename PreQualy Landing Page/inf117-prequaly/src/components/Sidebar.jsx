// ── Icons ─────────────────────────────────────────────────────────────────────
function DashIcon() { return <svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="2" width="7" height="7" rx="1.5" opacity=".8" /><rect x="11" y="2" width="7" height="7" rx="1.5" /><rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" opacity=".8" /></svg> }
function CollapseIcon() { return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 5l-5 5 5 5" /></svg> }
function ExpandIcon() { return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 5l5 5-5 5" /></svg> }

// ── Nav items (Dashboard only) ────────────────────────────────────────────────
const MAIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: DashIcon },
]

// ── PreQualy SVG Logo ─────────────────────────────────────────────────────────
function PrequalyLogo({ collapsed }) {
  if (collapsed) {
    return (
      <div className="sidebar-logo-collapsed-container">
        <img
          src="/PreQualy Logo (Website).svg"
          alt="PreQualy Logo"
          className="sidebar-logo-collapsed-img"
        />
      </div>
    )
  }
  return (
    <img
      src="/PreQualy Logo (Website).svg"
      alt="PreQualy Logo"
      className="sidebar-logo-expanded-img"
    />
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar({ activePage, onNavigate, collapsed, onCollapse }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <PrequalyLogo collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {MAIN_NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-item-icon"><item.icon /></span>
            <span className="nav-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">AS</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Agency Admin</div>
            <div className="sidebar-user-role">LA Housing Dept.</div>
          </div>
        </div>

        {/* Compact collapse toggle */}
        <button
          className="collapse-btn"
          onClick={onCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </button>
      </div>
    </aside>
  )
}
