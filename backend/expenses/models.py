from django.db import models
from django.contrib.auth.models import User


class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    source = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"{self.user.username} - {self.source}"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('FOOD', 'FOOD'),
        ('TRAVEL', 'TRAVEL'),
        ('SHOPPING', 'SHOPPING'),
        ('EDUCATION', 'EDUCATION'),
        ('ENTERTAINMENT', 'ENTERTAINMENT'),
        ('HEALTHCARE', 'HEALTHCARE'),
        ('BILLS', 'BILLS'),
        ('MISCELLANEOUS', 'MISCELLANEOUS'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    expense_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"