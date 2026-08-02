from django.db import models
from django.contrib.auth.models import User

class Income(models.Model):
    SOURCE_CHOICES = [
        ('SALARY', 'SALARY'),
        ('POCKET_MONEY', 'POCKET_MONEY'),
        ('SCHOLARSHIP', 'SCHOLARSHIP'),
        ('FREELANCING', 'FREELANCING'),
        ('BUSINESS', 'BUSINESS'),
        ('OTHER', 'OTHER'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    description = models.TextField(blank=True)
    income_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.source})"
