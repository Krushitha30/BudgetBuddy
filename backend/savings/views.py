from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SavingsGoal
from .serializers import SavingsGoalSerializer


class SavingsGoalListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/savings/         - List all savings goals for logged-in user
    POST /api/savings/         - Create a new savings goal
    """
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavingsGoalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/savings/<id>/  - Retrieve a savings goal
    PATCH  /api/savings/<id>/  - Update a savings goal
    DELETE /api/savings/<id>/  - Delete a savings goal
    """
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)


class SavingsGoalProgressView(APIView):
    """
    GET /api/savings/<id>/progress/
    Returns:
        - goal_name
        - target_amount
        - saved_amount
        - remaining_amount  = target_amount - saved_amount
        - progress_percentage = (saved_amount / target_amount) * 100
        - status
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            goal = SavingsGoal.objects.get(pk=pk, user=request.user)
        except SavingsGoal.DoesNotExist:
            return Response(
                {"error": "Savings goal not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        target_amount = float(goal.target_amount)
        saved_amount = float(goal.saved_amount)

        remaining_amount = target_amount - saved_amount
        progress_percentage = (saved_amount / target_amount * 100) if target_amount > 0 else 0.0

        # Auto-update status to COMPLETED if fully saved
        if saved_amount >= target_amount and goal.status == 'IN_PROGRESS':
            goal.status = 'COMPLETED'
            goal.save()

        return Response({
            "goal_name": goal.goal_name,
            "target_amount": round(target_amount, 2),
            "saved_amount": round(saved_amount, 2),
            "remaining_amount": round(remaining_amount, 2),
            "progress_percentage": round(progress_percentage, 2),
            "status": goal.status,
        }, status=status.HTTP_200_OK)
