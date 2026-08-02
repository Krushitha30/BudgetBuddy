from django.urls import path
from .views import BudgetListCreateView, BudgetRetrieveUpdateDestroyView, BudgetCategorySummaryView

urlpatterns = [
    path('', BudgetListCreateView.as_view(), name='budget-list-create'),
    path('summary/', BudgetCategorySummaryView.as_view(), name='budget-summary'),
    path('<int:pk>/', BudgetRetrieveUpdateDestroyView.as_view(), name='budget-detail'),
]
