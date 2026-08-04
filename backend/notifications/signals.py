from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from savings.models import SavingsGoal
from budgets.models import Budget
from expenses.models import Expense
from income.models import Income
from .models import Notification
from budgets.budget_alerts import generate_budget_alerts


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
        # General: Expense Added Notification
        Notification.objects.create(
            user=instance.user,
            title="New Expense Added",
            message=f"Added expense '{instance.title}' of ₹{instance.amount} under {instance.category}.",
            notification_type="EXPENSE",
            priority="LOW",
            is_read=False
        )

    # Task 1, 2, 3, 4: Always run budget alert check (for both create and update)
    try:
        from datetime import date as date_type
        expense_date = instance.expense_date
        # expense_date may be a string ('2026-07-10') or a date object
        if isinstance(expense_date, str):
            from datetime import datetime
            expense_date = datetime.strptime(expense_date, '%Y-%m-%d').date()
        budget = Budget.objects.get(
            user=instance.user,
            category=instance.category,
            month=expense_date.month,
            year=expense_date.year,
        )
        generate_budget_alerts(budget, instance.user)
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
