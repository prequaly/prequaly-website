import { useState, useRef, useCallback } from 'react'
import { parseCSV, STAKEHOLDER_TYPES } from '../services/csvParser'

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4l12 12M16 4L4 16"/>
    </svg>
  )
}

function UploadCloudIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M36 30a10 10 0 0 0-1-19.9A14 14 0 1 0 12 24.1" stroke="var(--teal-500)" strokeWidth="2.5"/>
      <path d="M24 26v14M18 32l6-6 6 6" stroke="var(--teal-500)" strokeWidth="2.5"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2h9l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
      <path d="M13 2v5h5"/>
    </svg>
  )
}

export default function CSVImporter({ onDataLoaded, onClose }) {
  const [dragging, setDragging]     = useState(false)
  const [parsed, setParsed]         = useState(null)
  const [forcedType, setForcedType] = useState(null)
  const [error, setError]           = useState(null)
  const [filename, setFilename]     = useState(null)
  const fileInputRef                = useRef(null)

  // ── Process file ────────────────────────────────────────────────────────────
  const processFile = useCallback((file) => {
    setError(null)
    setParsed(null)

    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }

    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = parseCSV(e.target.result, forcedType)
      if (result.error) {
        setError(result.error)
      } else {
        setParsed(result)
        // Auto-set forced type if detected
        if (result.type && !forcedType) setForcedType(result.type)
      }
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsText(file)
  }, [forcedType])

  // ── Re-parse when type changes ───────────────────────────────────────────
  const handleTypeChange = (type) => {
    setForcedType(type)
    if (filename && fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = parseCSV(e.target.result, type)
        if (result.error) setError(result.error)
        else { setParsed(result); setError(null) }
      }
      reader.readAsText(file)
    }
  }

  // ── Drag events ──────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }
  const onFileInput = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // ── Confirm load ─────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (parsed && onDataLoaded) {
      onDataLoaded({ ...parsed, filename })
      onClose()
    }
  }

  return (
    <div className="csv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csv-modal">
        {/* Header */}
        <div className="csv-modal-hd">
          <div>
            <div className="csv-modal-title">Import CSV Data</div>
            <div className="csv-modal-sub">Upload a stakeholder CSV to overlay data in the dashboard</div>
          </div>
          <button className="csv-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="csv-modal-body">
          {/* Drop zone */}
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileInput}
            />
            <div className="dz-icon"><UploadCloudIcon /></div>
            <div className="dz-title">
              {filename ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--teal-600)' }}>
                  <FileIcon /> {filename}
                </span>
              ) : 'Drop your CSV here'}
            </div>
            <div className="dz-sub">Drag & drop or click to browse — .csv files only</div>
            <button className="dz-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
              📂 Browse Files
            </button>
          </div>

          {/* Stakeholder type selector */}
          <div className="csv-type-section">
            <div className="csv-type-label">Stakeholder Type</div>
            <div className="csv-type-grid">
              {STAKEHOLDER_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  className={`csv-type-opt ${forcedType === value ? 'sel' : ''}`}
                  onClick={() => handleTypeChange(value)}
                >
                  {label}
                  {parsed?.type === value && forcedType !== value && (
                    <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--teal-500)' }}>✓ auto</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <div className="csv-error">⚠ {error}</div>}

          {/* Preview table */}
          {parsed && !error && (
            <div className="csv-preview">
              <div className="csv-preview-hd">
                <span className="csv-preview-title">
                  Preview — {parsed.label || 'Unknown Type'}
                </span>
                <span className="csv-preview-count">
                  {parsed.rows.length.toLocaleString()} rows · {parsed.headers.length} columns
                </span>
              </div>
              <div className="csv-preview-scroll">
                <table>
                  <thead>
                    <tr>
                      {parsed.headers.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.preview.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} title={cell}>{cell || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary stats */}
          {parsed?.summary && !error && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--fog-100)', borderRadius: 8, border: '1px solid var(--slate-200)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 8 }}>Summary</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                  <strong style={{ color: 'var(--navy-900)' }}>{parsed.summary.count.toLocaleString()}</strong> records
                </span>
                {parsed.summary.byState?.slice(0, 3).map(([state, n]) => (
                  <span key={state} style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    {state}: <strong style={{ color: 'var(--navy-900)' }}>{n}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="csv-actions">
            <button className="csv-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="csv-btn-confirm"
              disabled={!parsed || !!error}
              onClick={handleConfirm}
            >
              Load into Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
