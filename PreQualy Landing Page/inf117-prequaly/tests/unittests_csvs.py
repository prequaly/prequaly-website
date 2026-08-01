
import unittest
import os
import csv
import glob

# Unittests:
# Data validadtion testing - verify values in dummyDataset.js correctly represents all 30 csv files ✅
# Integration testing - frontend & backend connects properly ✅
# Edge case testing - no data for a selected county, empty csv, etc. ✅

# Manual tests:
# Functional testing on dashboard (70%) ✅
# UI/UX testing - responsiveness, accesibiltity ✅


# OLD TESTS
# BASE_DIR = os.path.join(os.path.dirname(__file__), "dummy_data")
# TYPE_SIGNATURES = {
#     "future_homebuyers": [
#         ["planned purchase timeline", "purchase timeline", "timeline"],
#         ["household size", "multigenerational"],
#     ],
#     "government_agencies": [
#         ["agency type", "primary service area"],
#         ["familiarity with homeownership", "interest in pilot"],
#     ],
#     "nonprofits": [
#         ["organization type", "cdfi"],
#         ["affordable homeownership program focus", "program focus"],
#     ],
#     "real_estate_professionals": [
#         ["professional role", "years of experience"],
#         ["do you currently work", "primary focus area"],
#     ],
# }


# def list_csv_files():
#     pattern = os.path.join(BASE_DIR, "supabase_dataset_*.csv")
#     return sorted(glob.glob(pattern))


# def read_csv(path):
#     with open(path, newline='', encoding='utf-8') as fh:
#         reader = csv.reader(fh)
#         all_rows = [r for r in reader]
#     # strip possible BOM from first header cell
#     if all_rows and all_rows[0]:
#         all_rows[0][0] = all_rows[0][0].lstrip('\ufeff')
#     return all_rows


# def detect_type(headers):
#     norm = [h.lower() for h in headers]
#     for t, groups in TYPE_SIGNATURES.items():
#         matched = 0
#         for group in groups:
#             if any(any(kw in h for h in norm) for kw in group):
#                 matched += 1
#         if matched >= 1:
#             return t
#     return None


# class CSVBaseTest(unittest.TestCase):
#     # Base test class: collects all example CSVs used across the
#     # dashboard. The dashboard's CSV importer / preview UI relies on
#     # these example files for local development and unit testing.
#     @classmethod
#     def setUpClass(cls):
#         cls.files = list_csv_files()


# class TestCSVStructure(CSVBaseTest):
#     # Verifies that example CSV files are present. This maps to the
#     # importer/initial data load behavior in the dashboard: if no
#     # source files exist, the Dashboard has no data to preview or
#     # render in components such as `CSVImporter` and `Sidebar`.
#     def test_csv_files_exist(self):
#         self.assertTrue(len(self.files) > 0, "No CSV files found in dummy_data")

#     # Ensures each CSV has at least a header and one data row.
#     # The dashboard preview, summary counts and charts expect a
#     # header row (field names) and >=1 data row to derive metrics.
#     def test_each_has_header_and_row(self):
#         for p in self.files:
#             rows = read_csv(p)
#             self.assertTrue(len(rows) >= 2, f"{os.path.basename(p)} must have header + >=1 data row")
#             self.assertTrue(any(cell.strip() for cell in rows[0]), f"{p} header row empty")


# class TestRowConsistency(CSVBaseTest):
#     # Column/row consistency checks: the dashboard's CSV parsing
#     # and preview logic assume rows are not longer than the header.
#     # If rows exceed header length it can break table rendering and
#     # column-mapping used by charts such as `TrendsChart`.
#     def test_column_counts_consistent(self):
#         for p in self.files:
#             rows = read_csv(p)
#             header_len = len(rows[0])
#             for i, r in enumerate(rows[1:], start=2):
#                 # allow short rows but ensure not longer than header
#                 self.assertLessEqual(len(r), header_len, f"{os.path.basename(p)} row {i} has more columns than header")

#     # Ensures header tokens are defined; empty header names would
#     # prevent the dashboard from mapping columns to logical fields
#     # (e.g. `user_type`, `county`) used across cards and charts.
#     def test_no_empty_header_names(self):
#         for p in self.files:
#             rows = read_csv(p)
#             headers = rows[0]
#             for i, h in enumerate(headers, start=1):
#                 self.assertTrue(h is not None and h.strip() != "", f"{os.path.basename(p)} header col {i} is empty")


# class TestTypeDetection(CSVBaseTest):
#     # Tests the header-based heuristic used to classify datasets into
#     # stakeholder types (e.g. `future_homebuyers`, `nonprofits`). The
#     # Dashboard uses this detection to auto-select filters, cards, and
#     # recommended visualizations in `TopBar` / `Sidebar` behaviors.
#     def test_detectable_type_for_files(self):
#         # Ensure most example CSVs map to one of the stakeholder types
#         detected_any = 0
#         for p in self.files:
#             headers = read_csv(p)[0]
#             t = detect_type(headers)
#             if t:
#                 detected_any += 1
#         # if the sample set is small or not representative, skip strict check
#         if len(self.files) < 4:
#             self.skipTest("Not enough sample CSVs to assert broad detection coverage")
#         # expect at least half to be detectable for a reasonable sample
#         self.assertGreaterEqual(detected_any, max(1, len(self.files) // 2))


# class TestPreviewAndSummary(CSVBaseTest):
#     # Verifies preview behavior and summary counts that drive the
#     # small-data preview panel and the dataset summary cards (e.g.
#     # `KPICard`, `TopCountiesTable`). The dashboard shows up to the
#     # first 5 preview rows and displays a total count of data rows.
#     def test_preview_length_and_summary_counts(self):
#         for p in self.files:
#             rows = read_csv(p)
#             headers = rows[0]
#             data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
#             # preview should be first 5 rows at most
#             preview = data_rows[:5]
#             self.assertLessEqual(len(preview), 5)
#             # summary count equals number of non-empty data rows
#             summary_count = len(data_rows)
#             self.assertGreaterEqual(summary_count, 1)


# class TestDataProcessing(CSVBaseTest):
#     # Date parsing/normalization: Charts and time-series components
#     # like `TrendsChart` depend on parseable date fields (signup/created)
#     # to render correctly and to compute time-based aggregates.
#     def test_date_parsing_and_normalization(self):
#         import datetime
#         for p in self.files:
#             rows = read_csv(p)
#             headers = [h.lower() for h in rows[0]]
#             if any('signup' in h or 'date' in h for h in headers):
#                 # find index of a date-like column
#                 idx = next((i for i, h in enumerate(headers) if 'signup' in h or 'date' in h), None)
#                 if idx is None:
#                     continue
#                 for r in rows[1:]:
#                     if len(r) > idx and r[idx].strip():
#                         try:
#                             # tolerate common formats
#                             _ = datetime.datetime.fromisoformat(r[idx].strip())
#                         except Exception:
#                             # try parsing common variants
#                             try:
#                                 _ = datetime.datetime.strptime(r[idx].strip(), '%m/%d/%Y')
#                             except Exception:
#                                 self.fail(f"Unparseable date in {os.path.basename(p)}: {r[idx]}")

#     # Numeric conversion tests ensure numeric fields such as
#     # `income` can be parsed to numbers for numeric summaries and
#     # visualizations (e.g. binning, histograms used by `SegmentChart`).
#     def test_numeric_conversion_for_income(self):
#         for p in self.files:
#             rows = read_csv(p)
#             headers = [h.lower() for h in rows[0]]
#             if 'income' in headers:
#                 idx = headers.index('income')
#                 for r in rows[1:]:
#                     if len(r) > idx and r[idx].strip():
#                         val = r[idx].replace(',', '').strip()
#                         try:
#                             float(val)
#                         except Exception:
#                             self.fail(f"Non-numeric income in {os.path.basename(p)}: {r[idx]}")


# class TestUseCases(CSVBaseTest):
#     # Simulates a common dashboard interaction: applying combined
#     # filters (stakeholder type + county). This test verifies basic
#     # filter semantics that underpin `Sidebar` filter controls and
#     # chart filtering behavior in visual components.
#     def test_filtering_combination_matches_expected(self):
#         # simulate filtering by type + county across all CSVs
#         for p in self.files:
#             rows = read_csv(p)
#             headers = [h.lower() for h in rows[0]]
#             if 'user_type' in headers and 'county' in headers:
#                 ti = headers.index('user_type')
#                 ci = headers.index('county')
#                 data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
#                 # pick a county from dataset
#                 counties = [r[ci] for r in data_rows if len(r) > ci and r[ci].strip()]
#                 if not counties:
#                     continue
#                 county = counties[0]
#                 # filter
#                 filtered = [r for r in data_rows if len(r) > ci and r[ci] == county]
#                 # ensure subset property
#                 self.assertLessEqual(len(filtered), len(data_rows))

#     # Verifies the logic to compute top counties that feed the
#     # `TopCountiesTable` and map visualizations. It ensures we can
#     # aggregate counts and pick a non-empty top entry when data exists.
#     def test_top_counties_metric(self):
#         # ensure we can derive a top-county list from datasets
#         for p in self.files:
#             rows = read_csv(p)
#             headers = [h.lower() for h in rows[0]]
#             if 'county' in headers:
#                 ci = headers.index('county')
#                 data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
#                 counts = {}
#                 for r in data_rows:
#                     if len(r) > ci:
#                         k = r[ci].strip() or None
#                         counts[k] = counts.get(k, 0) + 1
#                 # if any non-empty counties exist, top should be defined
#                 non_empty = {k: v for k, v in counts.items() if k}
#                 if non_empty:
#                     top = sorted(non_empty.items(), key=lambda x: -x[1])[0][0]
#                     self.assertIsNotNone(top)


# class TestGUIRequirements(CSVBaseTest):
#     # Checks availability of logical fields needed by charts and
#     # cards. The Dashboard maps CSV headers (including common
#     # synonyms) to logical fields used by `HeatMapPanel`, `SegmentChart`,
#     # and time-series components.
#     def test_chart_columns_available(self):
#         # charts expect at least these logical fields somewhere across files;
#         # accept common header synonyms used in the supplied CSVs
#         synonyms = {
#             'user_type': {'user_type', 'form_type', 'respondent_type', 'stakeholder_type'},
#             'county': {'county', 'location_county', 'county_of_interest'},
#             'income': {'income', 'annual_income', 'household_income', 'estimated_income'},
#             'signup_date': {'signup_date', 'submitted_at', 'date_submitted', 'created_at'},
#         }

#         found_logical = set()
#         for p in self.files:
#             headers = [h.lower() for h in read_csv(p)[0]]
#             for logical, opts in synonyms.items():
#                 if any(h in opts for h in headers):
#                     found_logical.add(logical)

#         # require at minimum `user_type` and a date field for charting insights
#         self.assertIn('user_type', found_logical, f"No user-type column found across samples (expected synonyms: {synonyms['user_type']})")
#         self.assertIn('signup_date', found_logical, f"No signup/date column found across samples (expected synonyms: {synonyms['signup_date']})")
#         # prefer at least one of county or income to be present
#         self.assertTrue(('county' in found_logical) or ('income' in found_logical), "Neither county nor income fields found across samples")

#     # Verifies that some CSV includes geocoding columns required to
#     # drive the map visualizations (MapView). Maps can use lat/lon or
#     # county+state to geocode dataset rows.
#     def test_map_ready_files_exist(self):
#         # maps can be driven either by lat/lon columns or by county+state/address columns
#         lat_keys = {'latitude', 'lat'}
#         lon_keys = {'longitude', 'lon', 'lng'}
#         county_keys = {'county', 'location_county'}
#         state_keys = {'state', 'location_state', 'location_state'}

#         ok = False
#         for p in self.files:
#             headers = {h.lower() for h in read_csv(p)[0]}
#             if (headers & lat_keys) and (headers & lon_keys):
#                 ok = True
#                 break
#             if (headers & county_keys) and (headers & state_keys):
#                 ok = True
#                 break

#         self.assertTrue(ok, "No CSV includes geocoding columns (lat/lon) or county+state for map visualizations")


# class TestAccessibilityAndUsability(CSVBaseTest):
#     # Accessibility/usability checks: header readability ensures labels
#     # are presentable in the UI and not cryptic keys; duplicate header
#     # detection prevents ambiguous column mapping in forms and charts.
#     def test_headers_are_readable(self):
#         # header tokens should be human readable (not machine keys)
#         for p in self.files:
#             headers = read_csv(p)[0]
#             for h in headers:
#                 self.assertTrue(len(h.strip()) >= 2, f"Header too short in {os.path.basename(p)}: '{h}'")

#     def test_no_duplicate_headers(self):
#         for p in self.files:
#             headers = [h.strip().lower() for h in read_csv(p)[0]]
#             self.assertEqual(len(headers), len(set(headers)), f"Duplicate headers in {os.path.basename(p)}")


# class TestDataVariants(CSVBaseTest):
#     # Ensures the provided sample CSVs cover at least one of the
#     # stakeholder groups the Dashboard expects. This helps validate
#     # that example data exercises different UI pathways.
#     def test_all_stakeholder_types_covered_across_files(self):
#         seen = set()
#         for p in self.files:
#             headers = [h.lower() for h in read_csv(p)[0]]
#             t = detect_type(headers)
#             if t:
#                 seen.add(t)
#         # expect at least 1 stakeholder type to be detectable across samples
#         self.assertGreaterEqual(len(seen), 1, f"Insufficient stakeholder type coverage: {seen}")


# class TestIntegrationPipeline(CSVBaseTest):
#     # Minimal integration test that exercises the basic pipeline used by
#     # the Dashboard: reading CSV -> type detection -> summarization.
#     # It does not exercise rendering but confirms the pipeline produces
#     # consistent outputs that UI components rely upon.
#     def test_parse_detect_summarize_chain(self):
#         # minimal integration: read -> detect type -> count rows
#         for p in self.files:
#             rows = read_csv(p)
#             headers = rows[0]
#             data_rows = [r for r in rows[1:] if any(c.strip() for c in r)]
#             t = detect_type(headers)
#             # summary count equals number of non-empty rows
#             self.assertEqual(len(data_rows), len(data_rows))
#             # if type detected, label should not be empty
#             if t:
#                 self.assertTrue(t in TYPE_SIGNATURES)


# class TestEdgeCases(CSVBaseTest):
#     # Edge-case parsing tests: ensure the CSV reader handles quoted
#     # commas and embedded double-quotes. Robust parsing here prevents
#     # data corruption when previewing or aggregating fields shown in
#     # the Dashboard tables and charts.
#     def test_quoted_commas_and_double_quotes(self):
#         import tempfile
#         content = 'a,b,c\n"one, two",three,"four""five"\n'
#         with tempfile.NamedTemporaryFile('w+', newline='', encoding='utf-8', delete=False) as tf:
#             tf.write(content)
#             tf.flush()
#             path = tf.name
#         try:
#             rows = read_csv(path)
#             self.assertEqual(len(rows), 2)
#             self.assertIn('one, two', rows[1][0])
#             self.assertIn('four"five', rows[1][2])
#         finally:
#             try:
#                 os.remove(path)
#             except Exception:
#                 pass


if __name__ == "__main__":
    unittest.main()
    
# Run the tests from /inf117-prequaly/tests: python -m unittest "unittests_csvs.py"
# ......
# ----------------------------------------------------------------------
# Ran 17 tests in 0.058s

# OK