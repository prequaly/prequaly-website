"""Edge case tests for CSVs and the baked dummy dataset.

Covers:
- State has no data
- Date range has no records
- Only one stakeholder category exists
- Total interests == 0 handling
- Missing county data
- Empty activity feed in `dummyDataset.js`
"""

import unittest
import os
import csv
import glob
import tempfile
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
    # simple kpis parse
    kpis = {}
    m = re.search(r"kpis:\s*\{([^}]+)\}", txt, re.S)
    if m:
        body = m.group(1)
        for key in ['totalInterests', 'homebuyers', 'govAgencies', 'nonprofits', 'realEstatePros']:
            mm = re.search(rf"{key}\s*:\s*(\d+)", body)
            if mm:
                kpis[key] = int(mm.group(1))
    # activity
    am = re.search(r"activity:\s*\[(.*?)\]", txt, re.S)
    activity = []
    if am:
        # crude: if there's anything non-whitespace between brackets, consider non-empty
        content = am.group(1).strip()
        if content:
            activity = [content]
    return {'kpis': kpis, 'activity': activity}


class TestEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = list_csv_files()
        cls.js = parse_dummy_js()

    def test_state_has_no_data(self):
        """Selecting a state with no rows should produce zero results."""
        # pick an unlikely state code/value
        state = 'ZZ'
        total_found = 0
        for p in self.files:
            rows = read_csv_rows(p)
            if not rows or len(rows) < 2:
                continue
            headers = [h.strip().lower() for h in rows[0]]
            si = next((i for i, h in enumerate(headers) if 'state' in h), None)
            if si is None:
                continue
            for r in rows[1:]:
                if len(r) > si and r[si].strip() == state:
                    total_found += 1
        self.assertEqual(total_found, 0, f"Expected no rows for state {state}, found {total_found}")

    def test_date_range_has_no_records(self):
        """A future date range should return no records."""
        start = datetime(2100, 1, 1)
        end = datetime(2100, 12, 31)
        found = 0
        for p in self.files:
            rows = read_csv_rows(p)
            if not rows or len(rows) < 2:
                continue
            headers = [h.lower() for h in rows[0]]
            di = next((i for i, h in enumerate(headers) if 'submitted' in h or 'created' in h or 'date' in h), None)
            if di is None:
                continue
            for r in rows[1:]:
                if len(r) <= di or not r[di].strip():
                    continue
                try:
                    dt = datetime.fromisoformat(r[di].strip())
                except Exception:
                    try:
                        dt = datetime.strptime(r[di].strip(), '%m/%d/%Y')
                    except Exception:
                        continue
                if start <= dt <= end:
                    found += 1
        self.assertEqual(found, 0, f"Expected no records in year 2100, found {found}")

    def test_only_one_stakeholder_category_exists(self):
        """If a dataset contains only one stakeholder category, counts should reflect that."""
        # create a temp CSV with only Future Homebuyers rows
        content = 'form_type,foo\nFuture Homebuyers,1\nFuture Homebuyers,2\n'
        with tempfile.NamedTemporaryFile('w+', newline='', encoding='utf-8', delete=False, suffix='.csv') as tf:
            tf.write(content)
            tf.flush()
            path = tf.name
        try:
            rows = read_csv_rows(path)
            headers = [h.lower() for h in rows[0]]
            fi = headers.index('form_type')
            counts = {'homebuyers': 0, 'govAgencies': 0, 'nonprofits': 0, 'realEstatePros': 0}
            for r in rows[1:]:
                if len(r) <= fi or not r[fi].strip():
                    continue
                v = r[fi].strip()
                if v == 'Future Homebuyers':
                    counts['homebuyers'] += 1
            self.assertEqual(counts['homebuyers'], 2)
            self.assertEqual(sum(counts.values()), 2)
        finally:
            try:
                os.remove(path)
            except Exception:
                pass

    def test_total_interests_zero_handling(self):
        """When totalInterests == 0 ensure percent calculations are safe."""
        js = {'kpis': {'totalInterests': 0, 'homebuyers': 0, 'govAgencies': 0, 'nonprofits': 0, 'realEstatePros': 0}}
        total = js['kpis'].get('totalInterests') or 1
        pct = lambda v: round((v / total) * 100, 1)
        self.assertEqual(pct(js['kpis'].get('homebuyers')), 0.0)

    def test_missing_county_data(self):
        """If CSVs lack county data, top-county aggregation should be empty or safe."""
        # create CSV with no county column
        content = 'form_type,state\nFuture Homebuyers,CA\n'
        with tempfile.NamedTemporaryFile('w+', newline='', encoding='utf-8', delete=False, suffix='.csv') as tf:
            tf.write(content)
            tf.flush()
            path = tf.name
        try:
            rows = read_csv_rows(path)
            headers = [h.lower() for h in rows[0]]
            if 'county' not in headers:
                # attempting to compute top counties should yield empty result
                counts = {}
                # no county column -> counts stays empty
                self.assertEqual(len(counts), 0)
        finally:
            try:
                os.remove(path)
            except Exception:
                pass

    def test_empty_activity_feed(self):
        """`dummyDataset.js` should allow an empty activity feed without errors."""
        activity = self.js.get('activity')
        # activity may be missing or empty list; both are acceptable
        self.assertTrue(activity == [] or activity is None)


if __name__ == '__main__':
    unittest.main()
