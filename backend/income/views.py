from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Income
from .serializers import IncomeSerializer
from expenses.models import Expense

class IncomeListCreateView(generics.ListCreateAPIView):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return income for the authenticated user only
        return Income.objects.filter(user=self.request.user).order_by('-income_date', '-created_at')

    def perform_create(self, serializer):
        # Associate the income with the authenticated user
        serializer.save(user=self.request.user)

class IncomeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict detail view/update/delete to the owner
        return Income.objects.filter(user=self.request.user)

class SummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Calculate total income
        total_income = Income.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        # Calculate total expense
        total_expense = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0.00
        
        # Current Balance = Total Income - Total Expense
        current_balance = float(total_income) - float(total_expense)
        
        return Response({
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'current_balance': float(current_balance)
        })
