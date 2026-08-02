from rest_framework import serializers
from .models import SavingsGoal
from datetime import date


class SavingsGoalSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'user', 'goal_name', 'target_amount',
            'saved_amount', 'target_date', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_target_amount(self, value):
        """Target amount must always be greater than zero."""
        if value <= 0:
            raise serializers.ValidationError("Target amount must be greater than zero.")
        return value

    def validate_saved_amount(self, value):
        """Saved amount should never be negative."""
        if value < 0:
            raise serializers.ValidationError("Saved amount cannot be negative.")
        return value

    def validate_target_date(self, value):
        """Target date should not be in the past when creating a new goal."""
        # Only validate on create (not on update)
        if self.instance is None:
            if value < date.today():
                raise serializers.ValidationError("Target date cannot be in the past.")
        return value

    def validate(self, data):
        """Saved amount should not exceed target amount."""
        target = data.get('target_amount', getattr(self.instance, 'target_amount', None))
        saved = data.get('saved_amount', getattr(self.instance, 'saved_amount', 0))
        if target and saved > target:
            raise serializers.ValidationError(
                {"saved_amount": "Saved amount cannot exceed the target amount."}
            )
        return data
