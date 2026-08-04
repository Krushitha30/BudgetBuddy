from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Budget
from .serializers import BudgetSerializer
from .budget_alerts import calculate_utilization, ALERT_THRESHOLDS
from expenses.models import Expense

class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter budgets for the authenticated user only
        return Budget.objects.filter(user=self.request.user).order_by('-year', '-month', 'category')

    def perform_create(self, serializer):
        # Associate the budget with the authenticated user
        serializer.save(user=self.request.user)

class BudgetRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict detail view/update/delete to the owner
        return Budget.objects.filter(user=self.request.user)

class BudgetCategorySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category')
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        # Basic query validation
        if not category or not month or not year:
            return Response(
                {"error": "Please provide category, month, and year query parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"error": "Month and year must be valid integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        category = category.upper()

        # Retrieve budget amount
        try:
            budget = Budget.objects.get(user=request.user, category=category, month=month, year=year)
            budget_amount = float(budget.budget_amount)
        except Budget.DoesNotExist:
            budget_amount = 0.00

        # Retrieve total expenses for this user, category, month, and year
        expenses = Expense.objects.filter(
            user=request.user,
            category=category,
            expense_date__month=month,
            expense_date__year=year
        )
        total_expense = expenses.aggregate(total=Sum('amount'))['total'] or 0.00
        total_expense = float(total_expense)

        # Calculations
        remaining = budget_amount - total_expense
        if remaining > 0:
            remaining_budget = remaining
            overspent_amount = 0.00
        else:
            remaining_budget = 0.00
            overspent_amount = abs(remaining)

        return Response({
            "budget_amount": budget_amount,
            "total_expense": total_expense,
            "remaining_budget": remaining_budget,
            "overspent_amount": overspent_amount
        })


class BudgetAlertAPIView(APIView):
    """
    Task 5 - Budget Alert API
    GET /api/budgets/alerts/?category=FOOD&month=8&year=2026
    Returns:
        - budget_category
        - budget_amount
        - total_expense
        - budget_utilization_percentage
        - alert_level      (NONE / WARNING / HIGH_WARNING / EXCEEDED)
        - alert_message
    Protected by JWT Authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', '').upper()
        month    = request.query_params.get('month')
        year     = request.query_params.get('year')

        if not category or not month or not year:
            return Response(
                {"error": "Please provide category, month, and year query parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            month = int(month)
            year  = int(year)
        except ValueError:
            return Response(
                {"error": "Month and year must be valid integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            budget = Budget.objects.get(
                user=request.user, category=category, month=month, year=year
            )
        except Budget.DoesNotExist:
            return Response(
                {"error": f"No budget found for {category} in {month}/{year}."},
                status=status.HTTP_404_NOT_FOUND
            )

        total_expense, utilization_pct = calculate_utilization(budget, request.user)
        budget_amt = float(budget.budget_amount)
        overspent  = max(0, total_expense - budget_amt)

        # Determine alert level and message
        alert_level   = "NONE"
        alert_message = f"Budget is under control. You have used {utilization_pct:.1f}% of your {category} budget."

        for threshold in reversed(ALERT_THRESHOLDS):
            if utilization_pct >= threshold['min_pct']:
                alert_level   = threshold['level']
                alert_message = threshold['msg_tpl'].format(
                    pct=utilization_pct,
                    category=category,
                    spent=total_expense,
                    budget=budget_amt,
                    overspent=overspent,
                ).split(' [ALERT:')[0]   # strip duplicate-prevention marker
                break

        return Response({
            "budget_category":            category,
            "budget_amount":              round(budget_amt, 2),
            "total_expense":              round(total_expense, 2),
            "budget_utilization_percentage": round(utilization_pct, 2),
            "alert_level":               alert_level,
            "alert_message":             alert_message,
        }, status=status.HTTP_200_OK)
