from django.urls import path
from .views import ExpenseListCreateView, ExpenseRetrieveUpdateDestroyView

urlpatterns = [
    path('', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('<int:pk>/', ExpenseRetrieveUpdateDestroyView.as_view(), name='expense-detail'),
]
