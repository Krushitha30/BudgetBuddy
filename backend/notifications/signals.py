from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from savings.models import SavingsGoal
from budgets.models import Budget
from .models import Notification


@receiver(post_save, sender=SavingsGoal)
def handle_savings_goal_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="New Savings Goal Created",
            message=f"Savings goal '{instance.goal_name}' has been created with a target amount of {instance.target_amount}.",
            notification_type="SAVINGS",
            priority="MEDIUM",
            is_read=False
        )
    else:
        # Check if the goal was just completed or saved_amount reached target_amount
        if instance.status == 'COMPLETED' or instance.saved_amount >= instance.target_amount:
            # Prevent spamming completed notification if already notified
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
                    message=f"Congratulations! You have completed your savings goal '{instance.goal_name}'.",
                    notification_type="SAVINGS",
                    priority="HIGH",
                    is_read=False
                )


@receiver(post_save, sender=Budget)
def handle_budget_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="Budget Created",
            message=f"Budget of {instance.budget_amount} set for category '{instance.category}' ({instance.month}/{instance.year}).",
            notification_type="BUDGET",
            priority="MEDIUM",
            is_read=False
        )
    else:
        Notification.objects.create(
            user=instance.user,
            title="Budget Updated",
            message=f"Budget for category '{instance.category}' ({instance.month}/{instance.year}) was updated to {instance.budget_amount}.",
            notification_type="BUDGET",
            priority="MEDIUM",
            is_read=False
        )
