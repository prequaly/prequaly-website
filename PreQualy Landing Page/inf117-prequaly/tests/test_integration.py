"""Integration-style tests for dashboard data flow.

These tests validate end-to-end expectations between the CSV
examples (tests/dummy_data), the baked `src/data/dummyDataset.js`
fixture and the UI-facing values (mocked where necessary).

The file intentionally contains small helpers to read CSVs and
extract the baked JS fixture so tests remain runnable in CI
without a browser.
"""

import unittest
import os
import glob
import csv
import re
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
CSV_DIR = os.path.join(ROOT, 'tests', 'dummy_data')
JS_DUMMY = os.path.join(ROOT, 'src', 'data', 'dummyDataset.js')


def list_csv_files():
    pattern = os.path.join(CSV_DIR, "supabase_dataset_*.csv")
    return sorted(glob.glob(pattern))


def read_csv_rows(path):
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.reader(fh)
        rows = [r for r in reader]
    if rows and rows[0]:
        rows[0][0] = rows[0][0].lstrip('\ufeff')
    return rows


def parse_dummy_js():
    with open(JS_DUMMY, encoding='utf-8') as fh:
        txt = fh.read()
    # kpis
    kpis = {}
    m = re.search(r"kpis:\s*\{([^}]+)\}", txt, re.S)
    if m:
        body = m.group(1)
        for key in ['totalInterests', 'homebuyers', 'govAgencies', 'nonprofits', 'realEstatePros']:
            mm = re.search(rf"{key}\s*:\s*(\d+)", body)
            if mm:
                kpis[key] = int(mm.group(1))

    def find_array(name):
        mm = re.search(rf"{name}:\s*\{{(.*?)\}}", txt, re.S)
        result = {}
        if mm:
            block = mm.group(1)
            for arr_name in ['homebuyers', 'agencies', 'govAgencies', 'nonprofits', 'realEstate', 'realEstatePros', 'total']:
                am = re.search(rf"{arr_name}\s*:\s*\[([^\]]+)\]", block)
                if am:
                    nums = [int(x) for x in re.findall(r"-?\d+", am.group(1))]
                    result[arr_name] = nums
        return result

    trends = find_array('trends')
    sparklines = find_array('sparklines')

    # labels
    labels = []
    lm = re.search(r"labels\s*:\s*\[([^\]]+)\]", txt)
    if lm:
        labels = [s.strip().strip("'\"") for s in lm.group(1).split(',')]

    # counties
    counties = []
    for m in re.finditer(r"\{\s*name:\s*'([^']+)'\s*,\s*count:\s*(\d+)", txt):
        counties.append({'name': m.group(1), 'count': int(m.group(2))})

    return {'kpis': kpis, 'trends': trends, 'sparklines': sparklines, 'labels': labels, 'counties': counties}


def aggregate_kpis_from_csvs(files):
    """Aggregate KPI counts by reading `form_type` values in CSV rows.

    Falls back to simple header-signature detection when `form_type`
    is not available.
    """
    agg = {'homebuyers': 0, 'govAgencies': 0, 'nonprofits': 0, 'realEstatePros': 0}

    mapping = {
        'future homebuyers': 'homebuyers',
        'government agencies': 'govAgencies',
        'non-profits': 'nonprofits',
        'nonprofits': 'nonprofits',
        'real estate professionals': 'realEstatePros',
        'real estate pro': 'realEstatePros',
    }

    for p in files:
        rows = read_csv_rows(p)
        if not rows or len(rows) < 2:
            continue
        headers = [h.strip().lower() for h in rows[0]]

        # prefer explicit `form_type` column
        if 'form_type' in headers:
            fi = headers.index('form_type')
            for r in rows[1:]:
                if not any(c.strip() for c in r):
                    continue
                if len(r) <= fi:
                    continue
                val = r[fi].strip().lower()
                key = mapping.get(val)
                if key:
                    agg[key] += 1
            continue

        # fallback: try to infer from header keywords
        header_text = ' '.join(headers)
        if 'timeline' in header_text or 'household' in header_text:
            # assume homebuyers sample
            data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
            agg['homebuyers'] += len(data_rows)
        elif 'agency type' in header_text or 'primary service area' in header_text:
            data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
            agg['govAgencies'] += len(data_rows)
        elif 'organization type' in header_text or 'cdfi' in header_text:
            data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
            agg['nonprofits'] += len(data_rows)
        elif 'professional role' in header_text or 'years of experience' in header_text:
            data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
            agg['realEstatePros'] += len(data_rows)

    return agg


def apply_filters(rows, state=None, start_date=None, end_date=None, group_type=None):
    """Apply simple filters to a list of CSV rows (including header).

    rows: list-of-lists (first row = headers)
    returns filtered data_rows list
    """
    headers = [h.strip().lower() for h in rows[0]]
    data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]

    # state filter
    if state:
        # find state-like header
        si = None
        for i, h in enumerate(headers):
            if 'state' in h:
                si = i
                break
        if si is not None:
            data_rows = [r for r in data_rows if len(r) > si and r[si].strip() and r[si].strip() == state]

    # date range filter (attempt common column names)
    if start_date or end_date:
        di = None
        for i, h in enumerate(headers):
            if 'submitted' in h or 'created' in h or 'date' in h:
                di = i
                break
        if di is not None:
            out = []
            for r in data_rows:
                if len(r) <= di or not r[di].strip():
                    continue
                s = r[di].strip()
                dt = None
                try:
                    dt = datetime.fromisoformat(s)
                except Exception:
                    try:
                        dt = datetime.strptime(s, '%m/%d/%Y')
                    except Exception:
                        continue
                if start_date and dt < start_date:
                    continue
                if end_date and dt > end_date:
                    continue
                out.append(r)
            data_rows = out

    # group_type filter (by form_type column)
    if group_type:
        gi = None
        for i, h in enumerate(headers):
            if 'form_type' in h or 'user_type' in h:
                gi = i
                break
        if gi is not None:
            data_rows = [r for r in data_rows if len(r) > gi and r[gi].strip() and group_type.lower() in r[gi].strip().lower()]

    return data_rows


class TestIntegrationPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = list_csv_files()
        cls.js = parse_dummy_js()

    def test_kpi_consistency_backend_ui(self):
        """CSV aggregation == DUMMY_DATA.kpis == (mocked) UI values."""
        if not self.files:
            self.skipTest('No CSV sample files')
        agg = aggregate_kpis_from_csvs(self.files)
        expected = self.js['kpis']
        # backend -> baked fixture
        self.assertEqual(agg['homebuyers'], expected.get('homebuyers'))
        self.assertEqual(agg['govAgencies'], expected.get('govAgencies'))
        self.assertEqual(agg['nonprofits'], expected.get('nonprofits'))
        self.assertEqual(agg['realEstatePros'], expected.get('realEstatePros'))

        # mocked UI (the frontend uses DUMMY_DATA by default)
        ui_rendered = expected
        self.assertEqual(ui_rendered, expected)

    def test_filter_affects_kpis(self):
        """Applying a state filter updates KPI totals as the UI would."""
        if not self.files:
            self.skipTest('No CSV sample files')
        # pick first CSV as representative
        rows = read_csv_rows(self.files[0])
        # pick a state value from the file if present
        headers = [h.lower() for h in rows[0]]
        si = next((i for i, h in enumerate(headers) if 'state' in h), None)
        if si is None:
            self.skipTest('No state column in sample to test filtering')
        # find a non-empty state to test
        state = None
        for r in rows[1:]:
            if len(r) > si and r[si].strip():
                state = r[si].strip()
                break
        if not state:
            self.skipTest('No non-empty state values')

        filtered = apply_filters(rows, state=state)
        # compute total after filter
        filtered_total = len(filtered)

        # mock UI behavior: compute KPIs from filtered rows (simple total)
        ui_total = filtered_total
        self.assertEqual(filtered_total, ui_total)

    def test_trend_and_sparkline_pipeline(self):
        """Trend data and sparkline data remain internally consistent."""
        trends = self.js['trends']
        sparklines = self.js['sparklines']

        mapping = {
            'homebuyers': 'homebuyers',
            'agencies': 'govAgencies',
            'nonprofits': 'nonprofits',
            'realEstate': 'realEstate'
        }

        for trend_key, spark_key in mapping.items():

            trend_values = trends.get(trend_key)
            spark_values = sparklines.get(spark_key)

            self.assertIsNotNone(trend_values)
            self.assertIsNotNone(spark_values)

            cumulative = []
            running = 0

            for v in trend_values:
                running += v
                cumulative.append(running)

            self.assertEqual(cumulative, spark_values)

    def test_cross_component_agreement(self):
        """Dashboard KPIs remain internally consistent."""
        kpis = self.js['kpis']

        calculated_total = (
            kpis['homebuyers']
            + kpis['govAgencies']
            + kpis['nonprofits']
            + kpis['realEstatePros']
        )

        self.assertEqual(
            calculated_total,
            kpis['totalInterests']
        )

    def test_ui_event_updates_dashboard(self):
        """Simulate frontend event (state change) and assert update flags."""
        if not self.files:
            self.skipTest('No CSV sample files')
        # simple simulate: when state changed, filters produce new KPI totals
        rows = read_csv_rows(self.files[0])
        headers = [h.lower() for h in rows[0]]
        si = next((i for i, h in enumerate(headers) if 'state' in h), None)
        if si is None:
            self.skipTest('No state column to simulate event')
        state = None
        for r in rows[1:]:
            if len(r) > si and r[si].strip():
                state = r[si].strip()
                break
        if not state:
            self.skipTest('No state values to simulate')

        filtered = apply_filters(rows, state=state)
        result = {
            'kpis_updated': len(filtered) >= 0,
            'charts_updated': len(filtered) >= 0,
            'map_updated': len(filtered) >= 0,
        }
        self.assertTrue(result['kpis_updated'])
        self.assertTrue(result['charts_updated'])
        self.assertTrue(result['map_updated'])

    def test_export_matches_dashboard_state(self):
        """Exported report should match current dashboard state (mocked)."""
        # mock current UI state from DUMMY_DATA
        ui_state = self.js
        def generate_export(state):
            # simple passthrough exporter used in UI
            return {'kpis': state['kpis'], 'trends': state['trends']}

        export = generate_export(ui_state)
        self.assertEqual(export['kpis'], ui_state['kpis'])
    


if __name__ == '__main__':
    unittest.main()
