import unittest

import app


class RecommendationCoverageTests(unittest.TestCase):
    def test_every_subject_challenge_time_path_returns_a_complete_plan(self):
        checked = 0
        for subject, struggles in app.SUBJECT_STRUGGLES.items():
            for struggle in struggles:
                for time_choice in app.TIME_MODIFIERS:
                    with self.subTest(subject=subject, struggle=struggle, time=time_choice):
                        result = app.recommend(subject, struggle, time_choice)
                        self.assertTrue(result["method"].strip())
                        self.assertTrue(result["reason"].strip())
                        self.assertTrue(result["steps"])
                        self.assertTrue(result["time_note"].strip())
                        self.assertTrue(result["fit"]["label"])
                        self.assertIn(result["fit"]["label"], {"Strong match", "Good match", "Starting point"})
                        self.assertLessEqual(len(result["steps"]), app.TIME_MODIFIERS[time_choice]["max_steps"])
                        self.assertLessEqual(len(result["alternatives"]), 2)
                        checked += 1
        self.assertEqual(checked, 126)

    def test_subject_rules_are_labeled_as_strong_matches(self):
        result = app.recommend("math", "memorizing formulas", "short")
        self.assertEqual(result["fit"]["label"], "Strong match")

    def test_generic_rules_are_labeled_as_good_matches(self):
        result = app.recommend("math", "preparing for a test", "medium")
        self.assertEqual(result["fit"]["label"], "Good match")

    def test_unknown_challenge_returns_an_honest_starting_point(self):
        result = app.recommend("math", "an unlisted challenge", "medium")
        self.assertTrue(result["method"])
        self.assertTrue(result["steps"])
        self.assertEqual(result["fit"]["label"], "Starting point")


if __name__ == "__main__":
    unittest.main()
