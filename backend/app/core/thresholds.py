"""Configurable academic analytics thresholds (rule-based, transparent)."""

# Performance categories (%)
EXCELLENT_MIN = 90
GOOD_MIN = 75
AVERAGE_MIN = 50

# Attendance categories (%)
ATTENDANCE_GOOD_MIN = 85
ATTENDANCE_FAIR_MIN = 75
ATTENDANCE_WARNING_MIN = 60

# Risk scoring thresholds
RISK_LOW_MAX = 20
RISK_MODERATE_MAX = 40
RISK_HIGH_MAX = 60

# Risk point weights
RISK_POINTS_LOW_PERFORMANCE = 25       # percentage < AVERAGE_MIN
RISK_POINTS_LOW_ATTENDANCE = 20        # attendance < ATTENDANCE_FAIR_MIN
RISK_POINTS_CRITICAL_ATTENDANCE = 15   # attendance < ATTENDANCE_WARNING_MIN
RISK_POINTS_POOR_ASSESSMENT = 15       # avg of quiz/assignment/internal < 50
RISK_POINTS_DECLINING = 10             # latest assessment dropped > 15%

# Assessment max marks (for validation)
MAX_ASSIGNMENT = 20
MAX_QUIZ = 20
MAX_INTERNAL = 20
MAX_MIDTERM = 50
MAX_ENDTERM = 100

DECLINE_THRESHOLD = 15  # % drop to flag declining performance
