from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from savings.models import SavingsGoal
from budgets.models import Budget
from expenses.models import Expense
from income.models import Income
from .models import Notification


@receiver(post_save, sender=SavingsGoal)
def handle_savings_goal_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="New Savings Goal Created",
            message=f"Savings goal '{instance.goal_name}' created with target amount of ${instance.target_amount}.",
            notification_type="SAVINGS",
            priority="MEDIUM",
            is_read=False
        )
    else:
        if instance.status == 'COMPLETED' or instance.saved_amount >= instance.target_amount:
            exists = Notification.objects.filter(
                user=instance.user,
                notification_type="SAVINGS",
                title="Savings Goal Completed!",
                message__contains=f"'{instance.goal_name}'"
            ).exists()
            if not exists:
                Notification.objects.create(
                    user=instance.user,
                    title="Savings Goal Completed!",
                    message=f"Congratulations! You completed your savings goal '{instance.goal_name}'.",
                    notification_type="SAVINGS",
                    priority="HIGH",
                    is_read=False
                )
        else:
            Notification.objects.create(
                user=instance.user,
                title="Savings Goal Updated",
                message=f"Saved amount for '{instance.goal_name}' updated to ${instance.saved_amount}.",
                notification_type="SAVINGS",
                priority="LOW",
                is_read=False
            )


@receiver(post_save, sender=Budget)
def handle_budget_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="Budget Created",
            message=f"Budget of ${instance.budget_amount} set for category '{instance.category}' ({instance.month}/{instance.year}).",
            notification_type="BUDGET",
            priority="MEDIUM",
            is_read=False
        )
    else:
        Notification.objects.create(
            user=instance.user,
            title="Budget Updated",
            message=f"Budget for category '{instance.category}' ({instance.month}/{instance.year}) updated to ${instance.budget_amount}.",
            notification_type="BUDGET",
            priority="MEDIUM",
            is_read=False
        )


@receiver(post_save, sender=Expense)
def handle_expense_notification(sender, instance, created, **kwargs):
    if created:
        # 1. General Expense Added Notification
        Notification.objects.create(
            user=instance.user,
            title="New Expense Added",
            message=f"Added expense '{instance.title}' of ${instance.amount} under {instance.category}.",
            notification_type="EXPENSE",
            priority="LOW",
            is_read=False
        )

        # 2. Check if total expenses exceed category budget
        month = instance.expense_date.month
        year = instance.expense_date.year
        category = instance.category

        try:
            budget = Budget.objects.get(user=instance.user, category=category, month=month, year=year)
            total_expense = Expense.objects.filter(
                user=instance.user,
                category=category,
                expense_date__month=month,
                expense_date__year=year
            ).aggregate(total=Sum('amount'))['total'] or 0

            if total_expense > budget.budget_amount:
                overspent = total_expense - budget.budget_amount
                Notification.objects.create(
                    user=instance.user,
                    title="⚠️ Budget Exceeded Alert!",
                    message=f"Alert: You have overspent your {category} budget for {month}/{year} by ${overspent:.2f}! (Budget: ${budget.budget_amount}, Spent: ${total_expense:.2f})",
                    notification_type="BUDGET",
                    priority="HIGH",
                    is_read=False
                )
        except Budget.DoesNotExist:
            pass


@receiver(post_save, sender=Income)
def handle_income_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="Income Added",
            message=f"Received income '{instance.title}' of ${instance.amount} ({instance.source}).",
            notification_type="GENERAL",
            priority="LOW",
            is_read=False
        )
