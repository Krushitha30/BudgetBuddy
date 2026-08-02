from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/notifications/         - View all notifications for logged-in user
    POST /api/notifications/         - Create a notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        is_read = self.request.query_params.get('is_read', None)
        if is_read is not None:
            if is_read.lower() == 'true':
                queryset = queryset.filter(is_read=True)
            elif is_read.lower() == 'false':
                queryset = queryset.filter(is_read=False)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NotificationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/notifications/<id>/  - Retrieve a notification
    PATCH  /api/notifications/<id>/  - Update a notification
    DELETE /api/notifications/<id>/  - Delete a notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkAsReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/  - Mark a single notification as read (is_read = True)
    POST  /api/notifications/<id>/read/  - Also supports POST
    """
    permission_classes = [IsAuthenticated]

    def mark_read(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        notification.is_read = True
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response({
            "message": "Notification marked as read.",
            "notification": serializer.data
        }, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        return self.mark_read(request, pk)

    def post(self, request, pk):
        return self.mark_read(request, pk)


class NotificationMarkAllAsReadView(APIView):
    """
    POST /api/notifications/read-all/ - Mark all notifications as read
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated_count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({
            "message": f"Marked {updated_count} notification(s) as read."
        }, status=status.HTTP_200_OK)
