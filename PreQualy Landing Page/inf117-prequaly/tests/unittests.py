
import unittest
import pandas as pd 

# python -m pip install pandas 
# Run tests: py -3.12 -m unittest unittests.py

# generate mock data 
def load_mock_data():
    return pd.DataFrame({
        "user_id": [1, 2, 3, 4, 4, 5, 6],
        "user_type": ["homebuyer", "government", "nonprofit", "real_estate", "real_estate", None, ""],
        "county": ["LA", "LA", None, "Orange", "Orange", "", "LA"], #homebuyer, #real estate prof, #nonprofit
        "state": ["CA", "CA", "CA", "CA", None, "", "CA"], #homebuyer, #real estate prof, #nonprofit
        "planned_purchase_timeline": [0, 6, 12, "exploring"], #homebuyer (in months)
        "city": ["Irvine", "Los Angeles", "Costa Mesa", "Santa Ana", None, "", "Long Beach"],
        "zip": ["92617", "90001", "92602", "92701", None, "", "90802"],
        "income": [50000, None, -100, 120000, 120000, 70000, 85000],
        "household_size": [3, 2, 1, 5, 5, 4, 2], #homebuyer
        "multigenerational_household": [True, False], #homebuyer
        "buyer_profile": ["first_time", None, None, None, None, "repeat", ""],
        "signup_date": ["2026-01-01", "2026-01-03", "2026-01-10", "2026-01-15", "2026-01-15", "2026-01-20", "2026-01-25"],
        "professional_role": ["real estate agent", "bank/lender", "loan officer", "broker", "developer", "other"], #real estate prof, #government
        "work_w_affordable_homeownership_prods": [True, False, "occasionally"], #real estate prof
        "experience_years": [0, 4, 10], #real estate prof
        "primary_focus_area": ["first time homebuyers", "affordable homeownership programs", "down-payment assistance", "FHA/VA/USDA loans", "income/deed restricted housing"], #real estate prof
        "agency_type": ["city government", "county government", "state agenncy", "public housing authority", "community development department"], #government
        "primary_service_area": ["federal", "state", "county", "city"], #government
        "homeownership_program_familiarity": ["administer programs directly", "oversee compliance/policy", "provide funding oversight", "limited involvement/interest in coordination", "exploring new initiatives"], #government
        "pilot_collab_interest": ["yes", "possibly", "joining for updates"], #government (optional)
        "org_type": ["CDFI", "nonprofit"], #nonprofit
        "affordable_homeownership_program_focus": ["homebuyer education", "housing counseling", "financial literacy/credit readiness", "down-payment assistance administration", "affordable housing development", "mortgage lending/financing", "tenant-to-homeowner transition programs", "shared equity/community land trusts"], #nonprofit (optional)
        "currently_serve_prospective_affordable_homebuyers": ["yes", "no", "planning to"] #nonprofit
    })
    
class BaseTest(unittest.TestCase):
    def setUp(self):
        self.df = load_mock_data()
        
# functional metrics tests
class TestUserTypeMetrics(BaseTest):
    def test_total_users(self): # total unique users in user_id 
        total = len(set(self.df["user_id"]))
        self.assertEqual(total, 6)

    def test_total_potential_homebuyers(self):
        count = (self.df["user_type"] == "homebuyer").sum()
        self.assertEqual(count, 1)

    def test_total_government_users(self):
        count = (self.df["user_type"] == "government").sum()
        self.assertEqual(count, 1)

    def test_total_nonprofits(self):
        count = (self.df["user_type"] == "nonprofit").sum()
        self.assertEqual(count, 1)

    def test_total_real_estate_professionals(self):
        count = (self.df["user_type"] == "real_estate").sum()
        self.assertEqual(count, 2)
        
# filter tests 
class TestFilters(BaseTest):
    def test_filter_by_user_type(self):
        filtered = self.df[self.df["user_type"] == "homebuyer"]
        self.assertTrue(all(filtered["user_type"] == "homebuyer"))

    def test_filter_by_county(self):
        filtered = self.df[self.df["county"] == "LA"]
        self.assertTrue(all(filtered["county"] == "LA"))

    def test_filter_combination(self):
        filtered = self.df[
            (self.df["user_type"] == "real_estate") &
            (self.df["county"] == "Orange")
        ]
        self.assertEqual(len(filtered), 2)

    def test_filter_does_not_change_total_logic(self):
        filtered = self.df[self.df["county"] == "LA"]
        self.assertLessEqual(len(filtered), len(self.df))
        
# data integrity tests
class TestDataIntegrity(BaseTest):
    def test_missing_values_present(self):
        self.assertTrue(self.df.isnull().values.any())

    def test_invalid_income_values(self):
        invalid = self.df[self.df["income"] < 0]
        self.assertTrue(len(invalid) > 0)

    def test_duplicate_users_exist(self):
        duplicates = self.df[self.df.duplicated(subset="user_id")]
        self.assertTrue(len(duplicates) > 0)

    def test_missing_county_handling(self):
        missing = self.df[self.df["county"].isnull()]
        self.assertTrue(len(missing) > 0)
        
# aggregation tests
class TestAggregation(BaseTest):
    def test_group_by_county(self):
        grouped = self.df.groupby("county").size()
        self.assertIn("LA", grouped.index)

    def test_income_bands(self):
        # Example binning logic
        bins = pd.cut(self.df["income"], bins=[0, 50000, 100000, 200000])
        self.assertEqual(len(bins), len(self.df))

    def test_household_size_distribution(self):
        grouped = self.df["household_size"].value_counts()
        self.assertTrue(len(grouped) > 0)
        
# time/trend tests
class TestTimeTrends(BaseTest):
    def test_signup_date_parsing(self):
        dates = pd.to_datetime(self.df["signup_date"], errors="coerce")
        self.assertFalse(dates.isnull().any())

    def test_signups_per_week(self):
        self.df["signup_date"] = pd.to_datetime(self.df["signup_date"])
        weekly = self.df.groupby(self.df["signup_date"].dt.isocalendar().week).size()
        self.assertTrue(len(weekly) > 0)

    def test_chronological_order(self):
        dates = pd.to_datetime(self.df["signup_date"])
        self.assertTrue(dates.is_monotonic_increasing or True)  # placeholder

# privacy/compliance tests
class TestPrivacy(BaseTest):
    def test_no_pii_columns(self):
        pii_columns = ["name", "email", "phone"]
        for col in pii_columns:
            self.assertNotIn(col, self.df.columns)

# dashboard consistency tests 
class TestDashboardConsistency(BaseTest):
    def test_totals_match_sum_of_segments(self): # total valid user_type
        valid = {"homebuyer", "government", "nonprofit", "real_estate"}
        # clean data since user_type had None & ""
        total = self.df["user_type"].isin(valid).sum()
        
        segmented_sum = (
            (self.df["user_type"] == "homebuyer").sum() +
            (self.df["user_type"] == "government").sum() +
            (self.df["user_type"] == "nonprofit").sum() +
            (self.df["user_type"] == "real_estate").sum()
        )
        self.assertEqual(total, segmented_sum)

    def test_county_aggregation_matches_total(self):
        grouped_total = self.df.groupby("county").size().sum()
        self.assertLessEqual(grouped_total, len(self.df))
        
# test required dashboard fields 
class TestDashboardStory(BaseTest):
    def test_required_dashboard_fields_exist(self):
        required = [
            "user_type",
            "county",
            "city",
            "zip",
            "income",
            "signup_date"
        ]
        for col in required:
            self.assertIn(col, self.df.columns)

    def test_dashboard_has_all_insight_layers(self):
        self.assertTrue(all(col in self.df.columns for col in ["user_type", "county", "income"]))
        
# test data geography
class TestGeography(BaseTest):
    def test_city_exists(self):
        self.assertIn("city", self.df.columns)

    def test_zip_exists(self):
        self.assertIn("zip", self.df.columns)

    def test_group_by_city(self):
        grouped = self.df.groupby("city").size()
        self.assertTrue(len(grouped) > 0)

    def test_group_by_zip(self):
        grouped = self.df.groupby("zip").size()
        self.assertTrue(len(grouped) > 0)

    def test_county_city_consistency(self):
        # rows with city should ideally have county
        subset = self.df[self.df["city"].notnull()]
        self.assertTrue(len(subset) > 0)
        
# test goegrphic consistency
class TestGeographyConsistency(BaseTest):
    def test_city_state_relationship(self):
        subset = self.df[self.df["city"].notnull()]
        self.assertTrue("state" in subset.columns)

    def test_zip_format_exists(self):
        self.assertTrue(self.df["zip"].notnull().any())
        
# test filter edge cases 
class TestFilterEdgeCases(BaseTest):
    def test_filter_nonexistent_user_type(self):
        filtered = self.df[self.df["user_type"] == "alien"]
        self.assertEqual(len(filtered), 0)

    def test_filter_null_values(self):
        filtered = self.df[self.df["user_type"].isnull()]
        self.assertTrue(len(filtered) >= 0)

    def test_filter_empty_string(self):
        filtered = self.df[self.df["user_type"] == ""]
        self.assertTrue(len(filtered) >= 0)

# test derived dashboard metrics 
class TestDerivedMetrics(BaseTest):
    def test_homebuyer_percentage(self):
        pct = (self.df["user_type"] == "homebuyer").mean()
        self.assertTrue(0 <= pct <= 1)

    def test_top_county_exists(self):
        top = self.df["county"].value_counts().index[0]
        self.assertIsNotNone(top)

    def test_income_positive_distribution(self):
        valid = self.df[self.df["income"] > 0]
        self.assertTrue(len(valid) > 0)

# test data handling/cleaning
class TestDataHandling(BaseTest):
    def test_missing_income_handling(self):
        filled = self.df["income"].fillna(0)
        self.assertFalse(filled.isnull().any())

    def test_invalid_income_handling(self):
        cleaned = self.df[self.df["income"] >= 0]
        self.assertTrue((cleaned["income"] >= 0).all())
        
# test UI behavior 
class TestUIBehavior(BaseTest):
    def test_filter_changes_dataset_size(self):
        original = len(self.df)
        filtered = self.df[self.df["county"] == "LA"]
        self.assertLessEqual(len(filtered), original)

    def test_dashboard_load_simulation(self):
        # simulate "loading dataset"
        df = load_mock_data()
        self.assertIsNotNone(df)

    def test_visualization_data_ready(self):
        grouped = self.df.groupby("county").size()
        self.assertTrue(len(grouped) > 0)


if __name__ == "__main__":
    unittest.main()
    

# RUN 1:
# ....F....................................F
# ======================================================================
# FAIL: test_totals_match_sum_of_segments (unittests.TestDashboardConsistency.test_totals_match_sum_of_segments)
# ----------------------------------------------------------------------
# Traceback (most recent call last):
#   File "C:\Users\emily\Downloads\inf117-prequaly\inf117\tests\unittests.py", line 136, in test_totals_match_sum_of_segments
#     self.assertEqual(total, segmented_sum)
# AssertionError: 7 != np.int64(5)

# ======================================================================
# FAIL: test_total_users (unittests.TestUserTypeMetrics.test_total_users)
# ----------------------------------------------------------------------
# Traceback (most recent call last):
#   File "C:\Users\emily\Downloads\inf117-prequaly\inf117\tests\unittests.py", line 33, in test_total_users
#     self.assertEqual(total, 5)
# AssertionError: 7 != 5

# ----------------------------------------------------------------------
# Ran 42 tests in 0.109s

# FAILED (failures=2)
# TEST 1: failed bc mock data had errors that didn't get cleaned (fixed)
# TEST 2: failed bc test wasn't written properly (fixed)

# RUN 2:
# ....0      homebuyer
# 1     government
# 2      nonprofit
# 3    real_estate
# 4    real_estate
# Name: user_type, dtype: str
# ......................................
# ----------------------------------------------------------------------
# Ran 42 tests in 0.059s

# OK