from django.urls import path
from .views import (
    FinancialSummaryAPIView,
    CategoryExpenseAnalysisAPIView,
    MonthlyExpenseTrendAPIView,
    HighestLowestExpenseAPIView,
    DashboardAPIView
)

urlpatterns = [
    path('financial-summary/', FinancialSummaryAPIView.as_view(), name='analytics-financial-summary'),
    path('category-expenses/', CategoryExpenseAnalysisAPIView.as_view(), name='analytics-category-expenses'),
    path('monthly-trend/', MonthlyExpenseTrendAPIView.as_view(), name='analytics-monthly-trend'),
    path('expense-stats/', HighestLowestExpenseAPIView.as_view(), name='analytics-expense-stats'),
    path('dashboard/', DashboardAPIView.as_view(), name='analytics-dashboard'),
]
