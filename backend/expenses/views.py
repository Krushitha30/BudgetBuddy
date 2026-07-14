from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Expense
from .serializers import ExpenseSerializer

class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return expenses for the authenticated user only
        queryset = Expense.objects.filter(user=self.request.user)
        
        # Filter by category (case-insensitive)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)
            
        # Sort expenses
        sort = self.request.query_params.get('sort')
        if sort == 'oldest':
            queryset = queryset.order_by('expense_date', 'created_at')
        elif sort == 'highest_amount':
            queryset = queryset.order_by('-amount')
        elif sort == 'lowest_amount':
            queryset = queryset.order_by('amount')
        else:  # default is latest expenses first
            queryset = queryset.order_by('-expense_date', '-created_at')
            
        return queryset

    def perform_create(self, serializer):
        # Associate the expense with the authenticated user
        serializer.save(user=self.request.user)

class ExpenseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict detail view/update/delete to the owner
        return Expense.objects.filter(user=self.request.user)

class ExpenseTotalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Expense.objects.filter(user=request.user)
        
        # Support the same category filter in total calculation
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)
            
        total = queryset.aggregate(total_amount=Sum('amount'))['total_amount'] or 0.00
        return Response({'total_expense': float(total)})
