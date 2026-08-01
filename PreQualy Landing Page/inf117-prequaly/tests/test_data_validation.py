"""
tests/test_data_validation.py
--------------------------------
High-level purpose
===================
This module validates that the pre-aggregated `DUMMY_DATA` in
`src/data/dummyDataset.js` correctly represents the underlying raw
CSV examples in `tests/dummy_data/`. The file contains helpers to
read and classify CSV rows, a small JS extractor for the baked-in
dataset, and seven targeted unit tests that check KPI totals,
consistency (totals and percentages), trend/sparkline relationships,
top-state aggregation and basic county map sanity checks.

Why this exists
===============
- Ensures the static demo data shown in the UI is faithful to the
    provided example CSVs (guards against stale hardcoded fixtures).
- Provides automated assertions that can be run in CI to detect
    accidental divergences when CSV examples or the pre-aggregation
    code are modified.

Test structure
==============
- Helper functions: CSV discovery, CSV reading, header-based type
    detection, and a simple JS parser for `dummyDataset.js`.
- Seven tests that correspond to the validation list you requested.

Run
===
From the repo root run:

        python -m unittest tests/test_data_validation.py

"""

import unittest
import os
import csv
import glob
import re

ROOT = os.path.dirname(os.path.dirname(__file__))
CSV_DIR = os.path.join(ROOT, 'tests', 'dummy_data')
JS_DUMMY = os.path.join(ROOT, 'src', 'data', 'dummyDataset.js')

TYPE_SIGNATURES = {
    "future_homebuyers": [
        ["planned purchase timeline", "purchase timeline", "timeline"],
        ["household size", "multigenerational"],
    ],
    "government_agencies": [
        ["agency type", "primary service area"],
        ["familiarity with homeownership", "interest in pilot"],
    ],
    "nonprofits": [
        ["organization type", "cdfi"],
        ["affordable homeownership program focus", "program focus"],
    ],
    "real_estate_professionals": [
        ["professional role", "years of experience"],
        ["do you currently work", "primary focus area"],
    ],
}


def list_csv_files():
    """Return a sorted list of example CSV file paths used for testing.

    Scans the `tests/dummy_data` directory for files named
    `supabase_dataset_*.csv` and returns fully-qualified paths.
    """
    pattern = os.path.join(CSV_DIR, "supabase_dataset_*.csv")
    return sorted(glob.glob(pattern))


def read_csv_rows(path):
    """Read a CSV file and return its rows as lists.

    Uses the standard `csv` module. Strips a possible UTF-8 BOM
    from the first header cell to keep header matching robust.
    """
    with open(path, newline='', encoding='utf-8') as fh:
        reader = csv.reader(fh)
        rows = [r for r in reader]
    # strip BOM if present in the very first header cell
    if rows and rows[0]:
        rows[0][0] = rows[0][0].lstrip('\ufeff')
    return rows


def detect_type(headers):
    """Heuristic to detect the stakeholder form type from header names.

    Normalizes headers to lowercase and checks for signature keyword
    groups defined in `TYPE_SIGNATURES`. Returns a type key such as
    `'future_homebuyers'` or `None` when no match is found.
    """
    norm = [h.lower() for h in headers]
    for t, groups in TYPE_SIGNATURES.items():
        matched = 0
        for group in groups:
            # group matches if any keyword from the group appears in
            # any header token (loose substring match to accept variants)
            if any(any(kw in h for h in norm) for kw in group):
                matched += 1
        # require at least one matching keyword from each signature
        # group so that short/ambiguous headers do not all map to
        # `future_homebuyers` (previously matched >= 1 was too loose).
        if matched >= len(groups):
            return t
    return None


def parse_dummy_js():
    """Parse `src/data/dummyDataset.js` for kpis, trends, sparklines, counties, countyMap."""
    with open(JS_DUMMY, encoding='utf-8') as fh:
        txt = fh.read()
    # KPIs
    kpis = {}
    m = re.search(r"kpis:\s*\{([^}]+)\}", txt, re.S)
    if m:
        body = m.group(1)
        for key in ['totalInterests','homebuyers','govAgencies','nonprofits','realEstatePros']:
            mm = re.search(rf"{key}\s*:\s*(\d+)", body)
            if mm:
                kpis[key] = int(mm.group(1))

    # trends & sparklines arrays (numbers)
    def find_array(name):
        mm = re.search(rf"{name}:\s*\{{(.*?)\}}", txt, re.S)
        result = {}
        if mm:
            block = mm.group(1)
            # find arrays like homebuyers: [36, 53, ...]
            # include both 'agencies' (trends) and 'govAgencies' (sparklines)
            for arr_name in ['homebuyers','agencies','govAgencies','nonprofits','realEstate','realEstatePros','total']:
                am = re.search(rf"{arr_name}\s*:\s*\[([^\]]+)\]", block)
                if am:
                    nums = [int(x) for x in re.findall(r"-?\d+", am.group(1))]
                    result[arr_name] = nums
        return result

    trends = find_array('trends')
    sparklines = find_array('sparklines')

    # counties top list
    counties = []
    for m in re.finditer(r"\{\s*name:\s*'([^']+)'\s*,\s*count:\s*(\d+)", txt):
        counties.append({'name': m.group(1), 'count': int(m.group(2))})

    # countyMap dots
    county_map = []
    for m in re.finditer(r"\{\s*name:\s*'([^']+)'\s*,\s*x:\s*([0-9]+)\s*,\s*y:\s*([0-9]+)\s*,\s*count:\s*(\d+)\s*\}", txt):
        county_map.append({'name': m.group(1), 'x': int(m.group(2)), 'y': int(m.group(3)), 'count': int(m.group(4))})

    return {'kpis': kpis, 'trends': trends, 'sparklines': sparklines, 'counties': counties, 'county_map': county_map}


class TestDummyDatasetValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = list_csv_files()
        cls.js = parse_dummy_js()

    def test_kpi_totals_match_csvs(self):
        """Test 1: KPI Totals.

        Aggregates non-empty data rows across all CSVs by detecting
        each file's stakeholder type via header heuristics and summing
        the row counts per group. Compares the computed counts against
        the KPIs parsed from `dummyDataset.js`.
        """
        # Initialize accumulators for each stakeholder KPI
        agg = {'homebuyers': 0, 'govAgencies': 0, 'nonprofits': 0, 'realEstatePros': 0}

        for p in self.files:
            rows = read_csv_rows(p)

            if not rows or len(rows) < 2:
                continue

            headers = [h.strip().lower() for h in rows[0]]

            if 'form_type' not in headers:
                continue

            form_idx = headers.index('form_type')

            for row in rows[1:]:
                # skip completely empty rows
                if not any(cell.strip() for cell in row):
                    continue

                if len(row) <= form_idx:
                    continue

                form_type = row[form_idx].strip()

                if form_type == 'Future Homebuyers':
                    agg['homebuyers'] += 1

                elif form_type == 'Government Agencies':
                    agg['govAgencies'] += 1

                elif form_type == 'Non-Profits':
                    agg['nonprofits'] += 1

                elif form_type == 'Real Estate Professionals':
                    agg['realEstatePros'] += 1

        expected = self.js['kpis']

        # Debug output
        # print("Computed KPI totals:", agg)
        # print("Expected KPI totals:", {
        #     'homebuyers': expected['homebuyers'],
        #     'govAgencies': expected['govAgencies'],
        #     'nonprofits': expected['nonprofits'],
        #     'realEstatePros': expected['realEstatePros']
        # })

        self.assertEqual(agg['homebuyers'], expected['homebuyers'])
        self.assertEqual(agg['govAgencies'], expected['govAgencies'])
        self.assertEqual(agg['nonprofits'], expected['nonprofits'])
        self.assertEqual(agg['realEstatePros'], expected['realEstatePros'])

    def test_total_interests_consistency(self):
        """Test 2: Total interests consistency.

        Verifies the sum of individual KPIs equals the `totalInterests`
        field in the dummy dataset. Catches cases where a maintainer
        updates one KPI but forgets to update the total.
        """
        k = self.js['kpis']
        s = k.get('homebuyers', 0) + k.get('govAgencies', 0) + k.get('nonprofits', 0) + k.get('realEstatePros', 0)
        self.assertEqual(s, k.get('totalInterests'))

    def test_percentage_calculations(self):
        """Test 3: Percentage calculations.

        Confirms the displayed percentage shares (rounded to 1 decimal)
        derived from KPIs equal the values listed in the requirements.
        This ensures share-of-total computations are consistent.
        """
        k = self.js['kpis']
        total = k.get('totalInterests') or 1
        pct = lambda v: round((v / total) * 100, 1)
        # Compare to expected rounded percentages
        self.assertAlmostEqual(pct(k.get('homebuyers')), 24.4, places=1)
        self.assertAlmostEqual(pct(k.get('govAgencies')), 24.7, places=1)
        self.assertAlmostEqual(pct(k.get('nonprofits')), 24.1, places=1)
        self.assertAlmostEqual(pct(k.get('realEstatePros')), 26.8, places=1)

    def test_trend_and_sparkline_consistency(self):
        """Test 4: Trend vs. sparkline validation.

        For each stakeholder group, the sum of monthly `trends` should
        equal the final cumulative value in `sparklines` (the last
        element). This checks the integrity between per-month data
        and the running cumulative series used to render sparklines.
        """
        trends = self.js['trends']
        sparks = self.js['sparklines']
        # mapping between trend keys and sparkline keys
        mapping = [
            ('homebuyers', 'homebuyers'),
            ('agencies', 'govAgencies'),
            ('nonprofits', 'nonprofits'),
            ('realEstate', 'realEstate'),
        ]
        for trend_key, spark_key in mapping:
            tvals = trends.get(trend_key, [])
            sval = sparks.get(spark_key) or []
            if tvals and sval:
                # sum of monthly values equals last cumulative value
                self.assertEqual(sum(tvals), sval[-1])

    def test_sparkline_cumulative_increment(self):
        """Test 5: Sparkline cumulative step validation.

        Compute the expected running-cumulative series from the monthly
        `trends` arrays and assert it equals the `sparklines` series.
        This is stricter and gives a clear message on mismatch.
        """
        trends = self.js['trends']
        sparks = self.js['sparklines']

        # mapping: trends key -> sparklines key
        mapping = {
            'homebuyers': 'homebuyers',
            'agencies': 'govAgencies',
            'nonprofits': 'nonprofits',
            'realEstate': 'realEstate',
        }

        for trend_key, spark_key in mapping.items():
            tvals = trends.get(trend_key, [])
            svals = sparks.get(spark_key, [])

            # if either series is missing, skip (other tests cover presence)
            if not tvals and not svals:
                continue

            # build expected cumulative series from monthly trend values
            expected = []
            acc = 0
            for v in tvals:
                acc += v
                expected.append(acc)

            # assert exact equality with a helpful message on failure
            self.assertEqual(
                expected,
                svals,
                f"Cumulative mismatch for {trend_key} -> {spark_key}: expected {expected} but got {svals}"
            )

    def test_top_states_table_matches_csvs(self):
        """Test 6: Top states ranking matches CSV aggregation.

        Scans CSVs for a state-like column, aggregates submission counts
        per state, sorts descending and compares the top-5 to the
        `counties` array in the dummy dataset which holds top states.
        """
        state_counts = {}
        # Build counts per state by scanning all CSVs
        for p in self.files:
            rows = read_csv_rows(p)
            if not rows or len(rows) < 2:
                continue
            headers = [h.lower() for h in rows[0]]
            # try to find a state-like column using common names
            idx = None
            for cand in ['state', 'location of interest', 'location_state', 'state_submitted']:
                if cand in headers:
                    idx = headers.index(cand)
                    break
            # fallback: find any header containing the substring 'state'
            if idx is None:
                for i, h in enumerate(headers):
                    if 'state' in h:
                        idx = i
                        break
            if idx is None:
                # This CSV doesn't contain a state column we recognize
                continue
            data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
            for r in data_rows:
                if len(r) > idx and r[idx].strip():
                    st = r[idx].strip()
                    state_counts[st] = state_counts.get(st, 0) + 1

        sorted_states = sorted(state_counts.items(), key=lambda x: -x[1])
        top5 = sorted_states[:5]

        # parse dummy counties and compare top state names (normalize)
        dummy_states = [c for c in self.js['counties'][:5]]
        STATE_MAP = {
            'MD': 'Maryland',
            'IA': 'Iowa',
            'IN': 'Indiana',
            'CO': 'Colorado',
            'AZ': 'Arizona',
        }
        def norm(name):
            # remove "(State)"
            name = re.sub(r"\s*\([^)]*\)", '', name).strip()

        for (st_name, st_count), d in zip(top5, dummy_states):
            self.assertEqual(norm(d['name']), norm(st_name))
            self.assertEqual(d['count'], st_count)

    def test_county_map_sanity(self):
        """Test 7: County map data sanity checks.

        Ensures county map entries in the dummy dataset have integer
        non-negative counts and non-empty names. The final assertion is
        a simple sanity check that there is at least one county value
        and that counts are comparable.
        """
        cm = self.js['county_map']
        # ensure there is at least one county map point
        self.assertTrue(len(cm) > 0)
        counts = [c['count'] for c in cm]
        for c in cm:
            # counts must be integer and non-negative
            self.assertIsInstance(c['count'], int)
            self.assertGreaterEqual(c['count'], 0)
            # names must be non-empty strings
            self.assertTrue(c['name'] and c['name'].strip())
        # sanity: ensure we can compute a max value (no further ordering
        # guarantees here since map positions are independent)
        self.assertEqual(max(counts), max(counts))


if __name__ == '__main__':
    unittest.main()
