"""Rule-based risk scoring — transparent, data-driven (not AI)."""
from app.core import thresholds as t


def assessment_avg_pct(internal: float) -> float:
    return (internal / t.MAX_INTERNAL) * 100


def get_assessment_series(
    internal: float, midterm: float, endterm: float
) -> list[tuple[str, float]]:
    return [
        ("Internal", round((internal / t.MAX_INTERNAL) * 100, 1)),
        ("Midterm", round((midterm / t.MAX_MIDTERM) * 100, 1)),
        ("End Term", round((endterm / t.MAX_ENDTERM) * 100, 1)),
    ]


def compute_performance_trend(
    internal: float, midterm: float, endterm: float
) -> str:
    series = get_assessment_series(internal, midterm, endterm)
    values = [v for _, v in series]

    midterm_pct = (midterm / t.MAX_MIDTERM) * 100 if t.MAX_MIDTERM else 0
    endterm_pct = (endterm / t.MAX_ENDTERM) * 100 if t.MAX_ENDTERM else 0
    if midterm > 0 and endterm > 0:
        drop = midterm_pct - endterm_pct
        if drop >= t.DECLINE_THRESHOLD:
            return "Declining"

    if len(values) >= 4:
        early = sum(values[:2]) / 2
        late = sum(values[-2:]) / 2
        diff = late - early
        if diff >= 8:
            return "Improving"
        if diff <= -8:
            return "Declining"

    return "Stable"


def get_recommended_actions(
    reasons: list[str],
    marks_pct: float,
    attendance_pct: float,
    trend: str,
) -> list[str]:
    actions: list[str] = []
    if attendance_pct < t.ATTENDANCE_FAIR_MIN:
        actions.append("Discuss attendance issue with the student")
    if marks_pct < t.AVERAGE_MIN:
        actions.append("Review difficult topics in a one-on-one session")
    if any("below 50%" in r.lower() or "internal" in r.lower() for r in reasons):
        actions.append("Consider additional practice sessions")
    if trend == "Declining":
        actions.append("Monitor the next assessment closely")
    if attendance_pct < t.ATTENDANCE_WARNING_MIN:
        actions.append("Notify guardian about critical attendance")
    if not actions:
        actions.append("Continue regular monitoring — performance is satisfactory")
    return actions


def calculate_risk(
    marks_pct: float,
    attendance_pct: float,
    internal: float = 0,
    midterm: float = 0,
    endterm: float = 0,
) -> tuple[int, str, list[str], str]:
    score = 0
    reasons: list[str] = []

    if marks_pct < t.AVERAGE_MIN:
        score += t.RISK_POINTS_LOW_PERFORMANCE
        reasons.append(f"Current percentage is {marks_pct:.0f}%")

    if attendance_pct < t.ATTENDANCE_FAIR_MIN:
        score += t.RISK_POINTS_LOW_ATTENDANCE
        reasons.append(
            f"Attendance is {attendance_pct:.0f}%, below the {t.ATTENDANCE_FAIR_MIN}% threshold"
        )

    if attendance_pct < t.ATTENDANCE_WARNING_MIN:
        score += t.RISK_POINTS_CRITICAL_ATTENDANCE

    assess_avg = assessment_avg_pct(internal)
    if assess_avg < 50:
        score += t.RISK_POINTS_POOR_ASSESSMENT
        reasons.append("Internal performance is consistently below 50%")

    if midterm > 0 and endterm > 0:
        midterm_pct = (midterm / t.MAX_MIDTERM) * 100
        endterm_pct = (endterm / t.MAX_ENDTERM) * 100
        drop = midterm_pct - endterm_pct
        if drop >= t.DECLINE_THRESHOLD:
            score += t.RISK_POINTS_DECLINING
            reasons.append(
                f"Latest assessment score decreased by {drop:.0f}% compared with midterm"
            )

    trend = compute_performance_trend(internal, midterm, endterm)
    if trend == "Declining" and not any("decreased" in r for r in reasons):
        score += t.RISK_POINTS_DECLINING
        reasons.append("Overall performance trend is declining across assessments")

    if score <= t.RISK_LOW_MAX:
        level = "Low Risk"
    elif score <= t.RISK_MODERATE_MAX:
        level = "Moderate Risk"
    elif score <= t.RISK_HIGH_MAX:
        level = "High Risk"
    else:
        level = "Critical Risk"

    return score, level, reasons, trend


def is_at_risk(score: int) -> bool:
    return score > t.RISK_LOW_MAX


def main_reason(reasons: list[str], marks_pct: float, attendance_pct: float) -> str:
    if not reasons:
        return "Monitoring recommended"
    if marks_pct < t.AVERAGE_MIN and attendance_pct < t.ATTENDANCE_FAIR_MIN:
        return "Low marks + low attendance"
    if marks_pct < t.AVERAGE_MIN:
        return "Poor academic performance"
    if attendance_pct < t.ATTENDANCE_FAIR_MIN:
        return "Low attendance"
    return reasons[0]
