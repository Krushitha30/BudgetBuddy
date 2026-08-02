from rest_framework import serializers
from .models import Budget
from expenses.models import Expense

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'user', 'category', 'budget_amount', 'month', 'year', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_category(self, value):
        # Normalize category to uppercase to match Expense choices
        normalized = value.upper()
        allowed_categories = [choice[0] for choice in Expense.CATEGORY_CHOICES]
        if normalized not in allowed_categories:
            raise serializers.ValidationError(
                f"Invalid category. Must be one of: {', '.join(allowed_categories)}"
            )
        return normalized

    def validate_month(self, value):
        if not (1 <= value <= 12):
            raise serializers.ValidationError("Month must be an integer between 1 and 12.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user:
            return data

        category = data.get('category')
        month = data.get('month')
        year = data.get('year')

        # Since category can be normalized in validate_category, retrieve the normalized version
        # if it exists, otherwise use what's in data
        if category:
            category = category.upper()

        # Handle PATCH updates where some fields might not be present in data
        if not category and self.instance:
            category = self.instance.category
        if month is None and self.instance:
            month = self.instance.month
        if year is None and self.instance:
            year = self.instance.year

        queryset = Budget.objects.filter(
            user=request.user,
            category=category,
            month=month,
            year=year
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                {"non_field_errors": ["A budget for this category in the specified month and year already exists."]}
            )

        return data
