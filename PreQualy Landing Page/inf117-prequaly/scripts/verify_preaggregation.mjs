import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseCSV } from '../src/services/csvParser.js'
import { DUMMY_DATA } from '../src/data/dummyDataset.js'

// Resolve paths relative to repo root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const CSV_DIR = path.join(ROOT, 'tests', 'dummy_data')

function listCsvFiles() {
  if (!fs.existsSync(CSV_DIR)) return []
  return fs.readdirSync(CSV_DIR)
    .filter(f => f.toLowerCase().startsWith('supabase_dataset_') && f.toLowerCase().endsWith('.csv'))
    .map(f => path.join(CSV_DIR, f))
    .sort()
}

async function main() {
  const files = listCsvFiles()
  if (!files.length) {
    console.error('No CSV files found in tests/dummy_data')
    process.exit(2)
  }

  const KPI_MAP = {
    future_homebuyers: 'homebuyers',
    government_agencies: 'govAgencies',
    nonprofits: 'nonprofits',
    real_estate_professionals: 'realEstatePros',
  }

  const agg = { homebuyers: 0, govAgencies: 0, nonprofits: 0, realEstatePros: 0 }
  let fileCount = 0

  for (const p of files) {
    fileCount++
    const txt = fs.readFileSync(p, { encoding: 'utf8' })
    const res = parseCSV(txt, null)
    if (res.error) {
      console.warn(`Parse error for ${path.basename(p)}: ${res.error}`)
      continue
    }
    const count = (res.summary && typeof res.summary.count === 'number') ? res.summary.count : (res.rows ? res.rows.length : 0)
    const type = res.type || null
    if (type && KPI_MAP[type]) {
      agg[KPI_MAP[type]] += count
    } else {
      // If type not detected, attempt to infer by header keywords fallback
      // Here we just add to totalInterests (not per-group)
    }
  }

  const total = Object.values(agg).reduce((s, v) => s + v, 0)

  console.log('Aggregated from CSVs:')
  console.log(agg)
  console.log('Total aggregated count:', total)

  console.log('\nDUMMY_DATA.kpis:')
  console.log(DUMMY_DATA.kpis)

  const mismatches = []
  for (const k of ['homebuyers','govAgencies','nonprofits','realEstatePros']) {
    if (agg[k] !== DUMMY_DATA.kpis[k]) mismatches.push({ key: k, csv: agg[k], dummy: DUMMY_DATA.kpis[k] })
  }
  if (total !== DUMMY_DATA.kpis.totalInterests) mismatches.push({ key: 'totalInterests', csv: total, dummy: DUMMY_DATA.kpis.totalInterests })

  if (mismatches.length === 0) {
    console.log('\nOK — preaggregation matches DUMMY_DATA kpis')
    process.exit(0)
  }

  console.error('\nMISMATCHES FOUND:')
  for (const m of mismatches) console.error(` - ${m.key}: csv=${m.csv}  dummy=${m.dummy}`)
  process.exit(3)
}

main().catch(err => { console.error(err); process.exit(1) })
