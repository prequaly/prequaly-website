import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'

const GROUP_LABELS = {
  all: 'All Groups',
  homebuyers: 'Future Homebuyers',
  govAgencies: 'Government Agencies',
  nonprofits: 'Non-Profits',
  realEstatePros: 'Real Estate Professionals'
}

export default function App() {
  const [activePage, setActivePage]     = useState('dashboard')
  const [collapsed, setCollapsed]       = useState(false)
  const [activeGroup, setActiveGroup]   = useState('all')

  const handleExportReport = () => {
    window.print()
  }

  return (
    <div className="app-shell">
      {/* Print-only Header */}
      <div className="print-report-header">
        <div className="print-report-brand">
          <img src="/PreQualy Logo (Website).svg" alt="PreQualy Logo" />
        </div>
        <div className="print-report-meta">
          <h2>Interest & Stakeholder Engagement Report</h2>
          <div className="print-meta-grid">
            <div><strong>Group Filter:</strong> {GROUP_LABELS[activeGroup] || activeGroup}</div>
            <div><strong>Region:</strong> California</div>
            <div><strong>Timeframe:</strong> May 1 – May 31, 2024</div>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(c => !c)}
      />

      <div className={`main-area ${collapsed ? 'collapsed' : ''}`}>
        <TopBar
          onExportReport={handleExportReport}
        />
        <Dashboard
          activePage={activePage}
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
        />
      </div>
    </div>
  )
}
