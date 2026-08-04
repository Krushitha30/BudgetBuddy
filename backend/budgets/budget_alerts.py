"""
Budget Alert Logic (Tasks 1, 2, 3, 4)
--------------------------------------
Calculates budget utilization percentage and generates threshold-based
notifications. Prevents duplicate alerts per threshold per budget period.

Formula:
    Budget Utilization % = (Total Expense / Budget Amount) x 100

Thresholds:
    >= 80%  → WARNING
    >= 90%  → HIGH WARNING
    >= 100% → BUDGET EXCEEDED
"""

from django.db.models import Sum
from expenses.models import Expense
from budgets.models import Budget


ALERT_THRESHOLDS = [
    {
        'key': '80',
        'min_pct': 80,
        'max_pct': 89.99,
        'level': 'WARNING',
        'priority': 'MEDIUM',
        'title_tpl': "⚠️ 80% Budget Warning – {category}",
        'msg_tpl': "Warning: You have used {pct:.1f}% of your monthly {category} budget. (Spent: ₹{spent:.2f} / Budget: ₹{budget:.2f})",
    },
    {
        'key': '90',
        'min_pct': 90,
        'max_pct': 99.99,
        'level': 'HIGH_WARNING',
        'priority': 'HIGH',
        'title_tpl': "🚨 90% High Alert – {category}",
        'msg_tpl': "High Alert: You have used {pct:.1f}% of your monthly {category} budget. (Spent: ₹{spent:.2f} / Budget: ₹{budget:.2f})",
    },
    {
        'key': '100',
        'min_pct': 100,
        'max_pct': float('inf'),
        'level': 'EXCEEDED',
        'priority': 'HIGH',
        'title_tpl': "🔴 Budget Exceeded – {category}",
        'msg_tpl': "Budget Exceeded: Your {category} budget has been exceeded! (Spent: ₹{spent:.2f} / Budget: ₹{budget:.2f}, Overspent: ₹{overspent:.2f})",
    },
]


def calculate_utilization(budget, user):
    """
    Returns (total_expense, utilization_pct) for a given budget object.
    """
    total = Expense.objects.filter(
        user=user,
        category=budget.category,
        expense_date__month=budget.month,
        expense_date__year=budget.year,
    ).aggregate(total=Sum('amount'))['total'] or 0

    total = float(total)
    budget_amt = float(budget.budget_amount)
    pct = (total / budget_amt * 100) if budget_amt > 0 else 0
    return total, pct


def _alert_already_sent(user, category, month, year, threshold_key):
    """
    Task 3: Check if a notification for this exact threshold was already sent
    for this budget period (category + month + year).
    """
    from notifications.models import Notification
    marker = f"[ALERT:{threshold_key}:{category}:{month}/{year}]"
    return Notification.objects.filter(
        user=user,
        notification_type='BUDGET',
        message__contains=marker,
    ).exists()


def generate_budget_alerts(budget, user):
    """
    Task 1 + 2 + 3 + 4:
    Calculates utilization and creates the appropriate notification(s).
    Skips if an alert for the same threshold already exists (Task 3).
    """
    from notifications.models import Notification

    total_expense, utilization_pct = calculate_utilization(budget, user)
    budget_amt = float(budget.budget_amount)
    overspent = max(0, total_expense - budget_amt)

    for threshold in ALERT_THRESHOLDS:
        if utilization_pct >= threshold['min_pct']:
            key = threshold['key']
            # Task 3: Prevent duplicate alerts
            if _alert_already_sent(user, budget.category, budget.month, budget.year, key):
                continue

            marker = f"[ALERT:{key}:{budget.category}:{budget.month}/{budget.year}]"

            title = threshold['title_tpl'].format(category=budget.category)
            msg = threshold['msg_tpl'].format(
                pct=utilization_pct,
                category=budget.category,
                spent=total_expense,
                budget=budget_amt,
                overspent=overspent,
            ) + f" {marker}"

            # Task 4: Connect to Notification module with all required fields
            Notification.objects.create(
                user=user,
                title=title,
                message=msg,
                notification_type='BUDGET',
                priority=threshold['priority'],
                is_read=False,
            )
