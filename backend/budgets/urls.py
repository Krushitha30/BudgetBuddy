from django.urls import path
from .views import (
    BudgetListCreateView,
    BudgetRetrieveUpdateDestroyView,
    BudgetCategorySummaryView,
    BudgetAlertAPIView,
)

urlpatterns = [
    path('', BudgetListCreateView.as_view(), name='budget-list-create'),
    path('summary/', BudgetCategorySummaryView.as_view(), name='budget-summary'),
    path('alerts/', BudgetAlertAPIView.as_view(), name='budget-alerts'),
    path('<int:pk>/', BudgetRetrieveUpdateDestroyView.as_view(), name='budget-detail'),
]
