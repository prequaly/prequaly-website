import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useState, useEffect, useCallback, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import InfoIcon from './InfoIcon'

// ── Free data sources (no API key required) ──────────────────────────────────
const CA_GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson'
const US_GEOJSON_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'

// ── Static fallback data — shown only when Supabase returns no real data ──────
const CA_FALLBACK = {
  'Los Angeles': { count: 0 }, 'San Diego': { count: 0 }, 'Orange': { count: 0 },
  'San Bernardino': { count: 0 }, 'Riverside': { count: 0 }, 'Sacramento': { count: 0 },
  'Alameda': { count: 0 }, 'Santa Clara': { count: 0 }, 'Contra Costa': { count: 0 },
  'Fresno': { count: 0 }, 'Kern': { count: 0 }, 'San Francisco': { count: 0 },
  'Ventura': { count: 0 }, 'San Joaquin': { count: 0 }, 'Stanislaus': { count: 0 },
  'Tulare': { count: 0 }, 'Monterey': { count: 0 }, 'Placer': { count: 0 },
  'Merced': { count: 0 }, 'Santa Barbara': { count: 0 }, 'Solano': { count: 0 },
  'Sonoma': { count: 0 }, 'San Mateo': { count: 0 }, 'Santa Cruz': { count: 0 },
  'Shasta': { count: 0 }, 'Marin': { count: 0 }, 'Yolo': { count: 0 },
  'San Luis Obispo': { count: 0 }, 'Butte': { count: 0 }, 'Kings': { count: 0 },
  'El Dorado': { count: 0 }, 'Napa': { count: 0 }, 'Madera': { count: 0 },
  'Imperial': { count: 0 }, 'Humboldt': { count: 0 }, 'Nevada': { count: 0 },
  'Sutter': { count: 0 }, 'Yuba': { count: 0 }, 'Mendocino': { count: 0 },
  'Calaveras': { count: 0 }, 'Amador': { count: 0 }, 'Lake': { count: 0 },
  'San Benito': { count: 0 }, 'Tehama': { count: 0 }, 'Tuolumne': { count: 0 },
  'Siskiyou': { count: 0 }, 'Glenn': { count: 0 }, 'Colusa': { count: 0 },
  'Lassen': { count: 0 }, 'Plumas': { count: 0 }, 'Mono': { count: 0 },
  'Del Norte': { count: 0 }, 'Mariposa': { count: 0 }, 'Trinity': { count: 0 },
  'Modoc': { count: 0 }, 'Alpine': { count: 0 }, 'Sierra': { count: 0 }, 'Inyo': { count: 0 },
}

// ── Normalize a county/state name for fuzzy matching ────────────────────────
// Strips "County" suffix and lowercases so "Los Angeles County" matches "Los Angeles"
function normName(s) {
  return (s || '').toLowerCase().replace(/\s*county\s*$/i, '').trim()
}

/**
 * Build a lookup map { normalizedName: { count, delta } } from an array of
 * { name, count, delta } rows returned by useSupabaseData.
 */
function buildLookup(rows) {
  const lookup = {}
  if (!rows) return lookup
  rows.forEach(row => {
    lookup[normName(row.name)] = { count: row.count, delta: row.delta }
  })
  return lookup
}

// ── Color interpolation: dark navy → teal ────────────────────────────────────
function getColor(count, maxCount) {
  if (!count || maxCount === 0) return '#0e1a24'
  const t = Math.pow(Math.min(count / maxCount, 1), 0.6)
  const r = Math.round(14  + t * (79  - 14))
  const g = Math.round(26  + t * (175 - 26))
  const b = Math.round(36  + t * (176 - 36))
  return `rgb(${r},${g},${b})`
}

// ── MapController: resets center/zoom when view changes ──────────────────────
function MapController({ view }) {
  const map = useMap()
  useEffect(() => {
    if (view === 'ca') {
      map.setView([37.3, -119.4], 6, { animate: true, duration: 0.6 })
    } else {
      map.setView([39.5, -98.5], 4, { animate: true, duration: 0.6 })
    }
  }, [view, map])
  return null
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * MapView accepts optional `counties` and `states` props from the dashboard
 * (the same arrays returned by useSupabaseData). When provided, real counts
 * are shown. When absent or empty, the map renders with zero counts (all dark).
 *
 * Props:
 *   counties  — [{ name, count, delta }]  (CA county rows from Supabase)
 *   states    — [{ name, count, delta }]  (state rows from Supabase)
 */
export default function MapView({ counties, states }) {
  const [view, setView]       = useState('ca')
  const [caGeo, setCAGeo]     = useState(null)
  const [usGeo, setUSGeo]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const geoJsonRef            = useRef(null)

  // Build live lookup tables from props
  const countyLookup = buildLookup(counties)
  const stateLookup  = buildLookup(states)

  // Determines if we have ANY real Supabase data to show
  const hasLiveCountyData = counties && counties.length > 0
  const hasLiveStateData  = states  && states.length  > 0

  // Fetch CA counties on mount
  useEffect(() => {
    fetch(CA_GEOJSON_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setCAGeo(d); setLoading(false) })
      .catch(() => { setError('Could not load CA county data. Check your connection.'); setLoading(false) })
  }, [])

  // Fetch US states lazily when view switches
  useEffect(() => {
    if (view === 'us' && !usGeo) {
      fetch(US_GEOJSON_URL)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(d => setUSGeo(d))
        .catch(() => {})
    }
  }, [view, usGeo])

  // Build the active dataset: prefer live lookup, fall back to zero-count fallback
  const getDataset = useCallback((geoName) => {
    const key = normName(geoName)
    if (view === 'ca') {
      if (hasLiveCountyData) {
        return countyLookup[key] || { count: 0, delta: null }
      }
      return CA_FALLBACK[geoName] || { count: 0, delta: null }
    } else {
      if (hasLiveStateData) {
        return stateLookup[key] || stateLookup[geoName.toLowerCase()] || { count: 0, delta: null }
      }
      return { count: 0, delta: null }
    }
  }, [view, countyLookup, stateLookup, hasLiveCountyData, hasLiveStateData])

  // Max count for the current view (drives color scale)
  const maxCount = useCallback(() => {
    if (view === 'ca') {
      if (hasLiveCountyData) return Math.max(...counties.map(c => c.count), 1)
      return 1
    } else {
      if (hasLiveStateData) return Math.max(...states.map(s => s.count), 1)
      return 1
    }
  }, [view, counties, states, hasLiveCountyData, hasLiveStateData])

  // GeoJSON layer style
  const styleFeature = useCallback((feature) => {
    const { count } = getDataset(feature.properties.name)
    return {
      fillColor:   getColor(count, maxCount()),
      fillOpacity: count > 0 ? 0.82 : 0.12,
      color:       'rgba(79,175,176,0.35)',
      weight:      0.8,
    }
  }, [view, getDataset, maxCount]) // eslint-disable-line

  // Hover / tooltip per feature
  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.name
    const { count, delta } = getDataset(name)
    const displayName = view === 'ca' ? `${name} County` : name

    const deltaHtml = delta
      ? `&nbsp;·&nbsp; <span style="color:#10b981">↑ ${delta}</span>`
      : ''

    layer.bindTooltip(
      `<div class="pq-tip">
         <div class="pq-tip-name">${displayName}</div>
         <div class="pq-tip-val">${count.toLocaleString()}</div>
         <div class="pq-tip-sub">Total Interests${deltaHtml}</div>
       </div>`,
      { permanent: false, className: 'pq-tooltip', direction: 'top', offset: [0, -6], opacity: 1 }
    )

    layer.on('mouseover', function () {
      this.setStyle({ color: '#6dc4c5', weight: 1.8, fillOpacity: count > 0 ? 0.96 : 0.22 })
      this.bringToFront()
    })
    layer.on('mouseout', function () {
      geoJsonRef.current?.resetStyle(this)
    })
  }, [view, getDataset]) // eslint-disable-line

  const currentGeo = view === 'ca' ? caGeo : usGeo
  const subtitle   = view === 'ca' ? 'California · County Level' : 'United States · State Level'
  const isLive     = view === 'ca' ? hasLiveCountyData : hasLiveStateData

  return (
    <div className="card" style={{ animationDelay: '50ms' }}>
      {/* Header */}
      <div className="card-header">
        <div>
          <div className="card-title">
            Interest Heat Map
            <InfoIcon text="Visualizes geographic distribution of platform interest by shading regions darker where demand is highest, helping identify priority markets." />
          </div>
          <div className="card-subtitle">
            {subtitle}
            {isLive && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: '#1FB980',
                background: 'rgba(31,185,128,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div className="map-toggle">
          {[
            { id: 'ca', label: 'CA Counties' },
            { id: 'us', label: 'US States'   },
          ].map(v => (
            <button
              key={v.id}
              className={`map-toggle-btn ${view === v.id ? 'active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map body */}
      <div className="map-card-body">
        {loading && (
          <div className="loading-area" style={{ height: 400 }}>
            <div className="spinner" /> Loading map data…
          </div>
        )}
        {error && (
          <div className="loading-area" style={{ height: 400, flexDirection: 'column', color: 'var(--danger)' }}>
            <span style={{ fontSize: 28 }}>🗺️</span>
            <span style={{ marginTop: 8 }}>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="map-wrap">
              <MapContainer
                center={[37.3, -119.4]}
                zoom={6}
                style={{ height: '100%', width: '100%', background: '#0d1821' }}
                zoomControl
                scrollWheelZoom={false}
                attributionControl
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
                  subdomains="abcd"
                  maxZoom={19}
                />

                {currentGeo && (
                  <GeoJSON
                    key={`${view}-${isLive}`}
                    ref={geoJsonRef}
                    data={currentGeo}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                  />
                )}

                {/* Loading US data overlay */}
                {view === 'us' && !usGeo && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(13,24,33,0.6)', backdropFilter: 'blur(2px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontSize: 14 }}>
                      <div className="spinner" />Loading US map…
                    </div>
                  </div>
                )}

                <MapController view={view} />
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="map-legend-row">
              <span className="map-legend-label">Low Interest</span>
              <div className="map-legend-bar" />
              <span className="map-legend-label">High Interest</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
