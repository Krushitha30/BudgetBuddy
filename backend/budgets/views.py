from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Budget
from .serializers import BudgetSerializer
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
