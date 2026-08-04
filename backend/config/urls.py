from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # User Registration
    path('api/users/', include('users.urls')),

    # Expenses API
    path('api/expenses/', include('expenses.urls')),

    # Income API
    path('api/income/', include('income.urls')),

    # Budgets API
    path('api/budgets/', include('budgets.urls')),

    # Savings API
    path('api/savings/', include('savings.urls')),

    # Notifications API
    path('api/notifications/', include('notifications.urls')),

    # Analytics API
    path('api/analytics/', include('analytics.urls')),

    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]