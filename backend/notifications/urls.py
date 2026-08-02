from django.urls import path
from .views import (
    NotificationListCreateView,
    NotificationRetrieveUpdateDestroyView,
    NotificationMarkAsReadView,
    NotificationMarkAllAsReadView,
)

urlpatterns = [
    path('', NotificationListCreateView.as_view(), name='notification-list-create'),
    path('read-all/', NotificationMarkAllAsReadView.as_view(), name='notification-mark-all-read'),
    path('<int:pk>/', NotificationRetrieveUpdateDestroyView.as_view(), name='notification-detail'),
    path('<int:pk>/read/', NotificationMarkAsReadView.as_view(), name='notification-mark-read'),
]
