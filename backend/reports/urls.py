from django.urls import path
from .views import (
    MonthlyFinancialReportAPIView,
    ExpenseReportAPIView,
    SavingsReportAPIView,
    FullFinancialSummaryReportAPIView,
    ExportReportAPIView,
)

urlpatterns = [
    path('monthly-financial/', MonthlyFinancialReportAPIView.as_view(), name='reports-monthly-financial'),
    path('expenses/', ExpenseReportAPIView.as_view(), name='reports-expenses'),
    path('savings/', SavingsReportAPIView.as_view(), name='reports-savings'),
    path('financial-summary/', FullFinancialSummaryReportAPIView.as_view(), name='reports-financial-summary'),
    path('export/', ExportReportAPIView.as_view(), name='reports-export'),
]
