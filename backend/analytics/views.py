import calendar
from django.db.models import Sum
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from budgets.models import Budget
from expenses.models import Expense
from expenses.serializers import ExpenseSerializer
from income.models import Income
from income.serializers import IncomeSerializer
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from savings.models import SavingsGoal
from savings.serializers import SavingsGoalSerializer


def get_financial_summary_data(user):
    """Calculates financial summary metrics for a given user."""
    total_income = float(
        Income.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.0
    )
    total_expense = float(
        Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.0
    )
    current_balance = round(total_income - total_expense, 2)
    total_savings = float(
        SavingsGoal.objects.filter(user=user).aggregate(total=Sum('saved_amount'))['total'] or 0.0
    )

    # Calculate remaining budget across user's budget records
    user_budgets = Budget.objects.filter(user=user)
    total_remaining_budget = 0.0

    for budget in user_budgets:
        spent = Expense.objects.filter(
            user=user,
            category=budget.category,
            expense_date__month=budget.month,
            expense_date__year=budget.year
        ).aggregate(total=Sum('amount'))['total'] or 0.0
        remaining = float(budget.budget_amount) - float(spent)
        if remaining > 0:
            total_remaining_budget += remaining

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "current_balance": current_balance,
        "total_savings": round(total_savings, 2),
        "remaining_budget": round(total_remaining_budget, 2)
    }


def get_category_analysis_data(user):
    """Groups expenses by category and calculates total spending per category."""
    category_totals = Expense.objects.filter(user=user).values('category').annotate(
        total_amount=Sum('amount')
    ).order_by('-total_amount')

    by_category = {}
    categories_list = []

    for item in category_totals:
        cat = item['category']
        amt = float(item['total_amount'] or 0.0)
        by_category[cat] = round(amt, 2)
        categories_list.append({
            "category": cat,
            "total_spending": round(amt, 2)
        })

    return {
        "by_category": by_category,
        "categories": categories_list
    }


def get_monthly_trend_data(user):
    """Groups expenses month-wise."""
    expenses = Expense.objects.filter(user=user).order_by('expense_date')

    monthly_dict = {}
    monthly_list = []

    for expense in expenses:
        if expense.expense_date:
            month_name = calendar.month_name[expense.expense_date.month]
            year = expense.expense_date.year
            month_key = f"{month_name}"
            
            amount = float(expense.amount or 0.0)
            if month_key not in monthly_dict:
                monthly_dict[month_key] = 0.0
            monthly_dict[month_key] = round(monthly_dict[month_key] + amount, 2)

    for month_name, total in monthly_dict.items():
        monthly_list.append({
            "month": month_name,
            "total_expense": total
        })

    return {
        "monthly_trend": monthly_dict,
        "trend": monthly_list
    }


def get_highest_lowest_expense_data(user):
    """Returns highest, lowest, latest, and oldest expenses."""
    user_expenses = Expense.objects.filter(user=user)

    if not user_expenses.exists():
        return {
            "highest_expense": None,
            "lowest_expense": None,
            "latest_expense": None,
            "oldest_expense": None
        }

    highest = user_expenses.order_by('-amount').first()
    lowest = user_expenses.order_by('amount').first()
    latest = user_expenses.order_by('-expense_date', '-created_at').first()
    oldest = user_expenses.order_by('expense_date', 'created_at').first()

    return {
        "highest_expense": ExpenseSerializer(highest).data if highest else None,
        "lowest_expense": ExpenseSerializer(lowest).data if lowest else None,
        "latest_expense": ExpenseSerializer(latest).data if latest else None,
        "oldest_expense": ExpenseSerializer(oldest).data if oldest else None
    }


class FinancialSummaryAPIView(APIView):
    """Task 2 - Financial Summary API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_financial_summary_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class CategoryExpenseAnalysisAPIView(APIView):
    """Task 3 - Category-wise Expense Analysis API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_category_analysis_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class MonthlyExpenseTrendAPIView(APIView):
    """Task 4 - Monthly Expense Trend API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_monthly_trend_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class HighestLowestExpenseAPIView(APIView):
    """Task 5 - Highest & Lowest Expense API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_highest_lowest_expense_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class DashboardAPIView(APIView):
    """Task 6 - Combined Dashboard API"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Financial Summary
        summary_data = get_financial_summary_data(user)

        # 2. Category-wise Analysis
        category_data = get_category_analysis_data(user)

        # 3. Monthly Trend
        trend_data = get_monthly_trend_data(user)

        # 4. Highest & Lowest Expenses
        stats_data = get_highest_lowest_expense_data(user)

        # 5. Recent Transactions (Recent Expenses & Recent Incomes)
        recent_expenses = ExpenseSerializer(
            Expense.objects.filter(user=user).order_by('-expense_date', '-created_at')[:5],
            many=True
        ).data
        recent_income = IncomeSerializer(
            Income.objects.filter(user=user).order_by('-income_date', '-created_at')[:5],
            many=True
        ).data

        # 6. Latest Notifications
        latest_notifications = NotificationSerializer(
            Notification.objects.filter(user=user).order_by('-created_at')[:5],
            many=True
        ).data

        # 7. Active Savings Goals
        active_savings = SavingsGoalSerializer(
            SavingsGoal.objects.filter(user=user, status='IN_PROGRESS').order_by('-created_at'),
            many=True
        ).data

        return Response({
            "financial_summary": summary_data,
            "category_analysis": category_data,
            "monthly_trend": trend_data,
            "highest_lowest_expenses": stats_data,
            "recent_transactions": {
                "expenses": recent_expenses,
                "income": recent_income
            },
            "latest_notifications": latest_notifications,
            "active_savings_goals": active_savings
        }, status=status.HTTP_200_OK)
