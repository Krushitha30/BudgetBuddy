from datetime import date
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from budgets.models import Budget
from expenses.models import Expense
from income.models import Income
from notifications.models import Notification
from savings.models import SavingsGoal


class AnalyticsAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='analyticsuser', password='password123')
        self.other_user = User.objects.create_user(username='otheruser', password='password123')

        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Create Income
        Income.objects.create(
            user=self.user,
            title='Salary',
            amount=10000.00,
            source='SALARY',
            income_date=date(2026, 1, 15)
        )
        Income.objects.create(
            user=self.user,
            title='Freelance',
            amount=5000.00,
            source='FREELANCING',
            income_date=date(2026, 2, 10)
        )

        # Create Expenses
        self.exp1 = Expense.objects.create(
            user=self.user,
            title='Groceries',
            category='FOOD',
            amount=4500.00,
            expense_date=date(2026, 1, 20)
        )
        self.exp2 = Expense.objects.create(
            user=self.user,
            title='Clothes',
            category='SHOPPING',
            amount=7200.00,
            expense_date=date(2026, 2, 5)
        )
        self.exp3 = Expense.objects.create(
            user=self.user,
            title='Bus Pass',
            category='TRAVEL',
            amount=1800.00,
            expense_date=date(2026, 2, 25)
        )

        # Create Budget
        Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=5000.00,
            month=1,
            year=2026
        )

        # Create Savings Goal
        SavingsGoal.objects.create(
            user=self.user,
            goal_name='New Phone',
            target_amount=20000.00,
            saved_amount=3000.00,
            target_date=date(2026, 12, 31),
            status='IN_PROGRESS'
        )

        # Create Notification
        Notification.objects.create(
            user=self.user,
            title='Welcome Notification',
            message='Welcome to BudgetBuddy!',
            notification_type='SYSTEM',
            priority='LOW'
        )

    def test_financial_summary_api(self):
        """Task 2 - Financial Summary API"""
        response = self.client.get('/api/analytics/financial-summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Total Income = 10000 + 5000 = 15000
        self.assertEqual(data['total_income'], 15000.0)
        # Total Expense = 4500 + 7200 + 1800 = 13500
        self.assertEqual(data['total_expense'], 13500.0)
        # Current Balance = 15000 - 13500 = 1500
        self.assertEqual(data['current_balance'], 1500.0)
        # Total Savings = 3000
        self.assertEqual(data['total_savings'], 3000.0)
        # Remaining Budget = FOOD budget 5000 - Jan FOOD expense 4500 = 500
        self.assertEqual(data['remaining_budget'], 500.0)

    def test_category_expense_analysis_api(self):
        """Task 3 - Category-wise Expense Analysis API"""
        response = self.client.get('/api/analytics/category-expenses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertIn('by_category', data)
        self.assertEqual(data['by_category']['FOOD'], 4500.0)
        self.assertEqual(data['by_category']['SHOPPING'], 7200.0)
        self.assertEqual(data['by_category']['TRAVEL'], 1800.0)

    def test_monthly_expense_trend_api(self):
        """Task 4 - Monthly Expense Trend API"""
        response = self.client.get('/api/analytics/monthly-trend/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertIn('monthly_trend', data)
        # January total = 4500
        self.assertEqual(data['monthly_trend']['January'], 4500.0)
        # February total = 7200 + 1800 = 9000
        self.assertEqual(data['monthly_trend']['February'], 9000.0)

    def test_highest_lowest_expense_api(self):
        """Task 5 - Highest & Lowest Expense API"""
        response = self.client.get('/api/analytics/expense-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Highest expense is Clothes (7200.0)
        self.assertEqual(data['highest_expense']['title'], 'Clothes')
        self.assertEqual(float(data['highest_expense']['amount']), 7200.0)

        # Lowest expense is Bus Pass (1800.0)
        self.assertEqual(data['lowest_expense']['title'], 'Bus Pass')
        self.assertEqual(float(data['lowest_expense']['amount']), 1800.0)

        # Oldest expense is Groceries (2026-01-20)
        self.assertEqual(data['oldest_expense']['title'], 'Groceries')

        # Latest expense is Bus Pass (2026-02-25)
        self.assertEqual(data['latest_expense']['title'], 'Bus Pass')

    def test_dashboard_api(self):
        """Task 6 - Dashboard API combining all analytics"""
        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertIn('financial_summary', data)
        self.assertIn('category_analysis', data)
        self.assertIn('monthly_trend', data)
        self.assertIn('highest_lowest_expenses', data)
        self.assertIn('recent_transactions', data)
        self.assertIn('latest_notifications', data)
        self.assertIn('active_savings_goals', data)

        # Check subfields
        self.assertEqual(data['financial_summary']['total_income'], 15000.0)
        self.assertEqual(len(data['active_savings_goals']), 1)
        self.assertEqual(data['active_savings_goals'][0]['goal_name'], 'New Phone')
        self.assertGreaterEqual(len(data['latest_notifications']), 1)

    def test_jwt_protection_for_analytics(self):
        """All analytics APIs require JWT authentication"""
        self.client.credentials()  # Clear credentials

        endpoints = [
            '/api/analytics/financial-summary/',
            '/api/analytics/category-expenses/',
            '/api/analytics/monthly-trend/',
            '/api/analytics/expense-stats/',
            '/api/analytics/dashboard/',
        ]

        for url in endpoints:
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
