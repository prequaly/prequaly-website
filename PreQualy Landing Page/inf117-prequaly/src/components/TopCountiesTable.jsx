import { useMemo, useState } from 'react'
import InfoIcon from './InfoIcon'

const VIEW_OPTIONS = [
  { value: 'counties', label: 'CA Counties' },
  { value: 'states',   label: 'US States'   },
]

function formatLocationName(name, view) {
  if (!name) return 'Unknown'
  if (view === 'states') return name.replace(/\s*\(State\)$/, '')
  return name.includes('County') ? name : `${name} County`
}

function ColumnHeaders({ colHeader }) {
  return (
    <div className="county-col-header">
      <span>#</span>
      <span>{colHeader}</span>
      <span style={{ textAlign: 'right' }}>Interests</span>
      <span style={{ textAlign: 'right' }}>Change</span>
    </div>
  )
}

function TableRows({ rows, view, offset = 0 }) {
  return rows.map((county, i) => (
    <div key={county.name} className="county-row">
      <span className="county-rank">{String(offset + i + 1).padStart(2, '0')}</span>
      <span className="county-name">{formatLocationName(county.name, view)}</span>
      <span className="county-count">{county.count.toLocaleString()}</span>
      <span className={`county-delta ${county.up ? 'up' : 'dn'}`}>
        {county.up ? '↑' : '↓'} {county.delta}
      </span>
    </div>
  ))
}

const PAGE_SIZE = 25

export default function TopCountiesTable({ counties, states }) {
  const [view, setView]         = useState('counties')
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)

  const allRows = useMemo(() => {
    const data = view === 'states' ? states : counties
    return Array.isArray(data) ? data : []
  }, [view, counties, states])

  // Card shows top 5 only
  const cardRows = allRows.slice(0, 5)

  // Modal: filter then paginate
  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows
    const q = search.toLowerCase()
    return allRows.filter(r => formatLocationName(r.name, view).toLowerCase().includes(q))
  }, [allRows, search, view])

  const totalPages  = Math.ceil(filteredRows.length / PAGE_SIZE)
  const pagedRows   = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleViewChange = (v) => { setView(v); setPage(0); setSearch('') }
  const openModal  = () => { setPage(0); setSearch(''); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)

  const title     = view === 'states' ? 'Top States' : 'Top Counties'
  const colHeader = view === 'states' ? 'State'      : 'County'
  const infoText  = view === 'states'
    ? 'Ranks U.S. states by total platform interest, helping identify geographic demand hotspots at the national level.'
    : 'Ranks California counties by total platform interest, highlighting regional demand concentrations for targeted outreach.'

  return (
    <>
      <div className="card" style={{ animationDelay: '100ms' }}>
        {/* ── Row 1: title + info + view-all ── */}
        <div className="counties-card-header">
          <div className="counties-title-group">
            <span className="card-title" style={{ whiteSpace: 'nowrap' }}>{title}</span>
            <InfoIcon text={infoText} />
          </div>
          <button className="card-action" onClick={openModal}>View all</button>
        </div>

        {/* ── Row 2: view switcher sub-row ── */}
        <div className="counties-switcher-row">
          <div className="counties-view-switcher">
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`counties-view-btn ${view === opt.value ? 'active' : ''}`}
                onClick={() => handleViewChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <ColumnHeaders colHeader={colHeader} />

        {/* Top-5 rows on the card */}
        <div className="counties-table">
          {cardRows.length === 0
            ? <div className="loading-area" style={{ padding: '20px 0' }}>No {view === 'states' ? 'state' : 'county'} data</div>
            : <TableRows rows={cardRows} view={view} />
          }
        </div>
      </div>

      {/* ── Full-data modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="modal-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="modal-title">{title} — All Entries</div>
                <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
                  {filteredRows.length} {view === 'states' ? 'states' : 'counties'} total
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Inline view toggle in modal */}
                <div className="counties-view-switcher">
                  {VIEW_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`counties-view-btn ${view === opt.value ? 'active' : ''}`}
                      onClick={() => handleViewChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button className="modal-close" onClick={closeModal}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <path d="M5 5l10 10M15 5L5 15"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--slate-100)', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--slate-400)', pointerEvents: 'none' }}>
                  <circle cx="8" cy="8" r="5"/><path d="M13 13l4 4"/>
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${view === 'states' ? 'states' : 'counties'}…`}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0) }}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '8px 12px 8px 32px',
                    border: '1px solid var(--slate-200)', borderRadius: 8,
                    fontSize: 13, color: 'var(--navy-800)',
                    background: 'var(--fog-100)', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Column headers (sticky) */}
            <ColumnHeaders colHeader={colHeader} />

            {/* Scrollable rows */}
            <div className="modal-body">
              {pagedRows.length === 0
                ? <div className="loading-area" style={{ padding: '32px 0' }}>No results match "{search}"</div>
                : <TableRows rows={pagedRows} view={view} offset={page * PAGE_SIZE} />
              }
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="modal-pagination">
                <button
                  className="modal-page-btn"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Prev
                </button>
                <div className="modal-page-info">
                  Page {page + 1} of {totalPages}
                  <span style={{ color: 'var(--slate-400)', fontSize: 11 }}>
                    &nbsp;({page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredRows.length)} of {filteredRows.length})
                  </span>
                </div>
                <button
                  className="modal-page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
