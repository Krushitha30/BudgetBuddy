from datetime import date
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from budgets.models import Budget
from expenses.models import Expense
from income.models import Income
from savings.models import SavingsGoal


class ReportsAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='reportuser', password='password123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        today = date.today()
        self.today = today

        # Income
        Income.objects.create(
            user=self.user,
            title='Monthly Salary',
            amount=12000.00,
            source='SALARY',
            income_date=today
        )

        # Expenses
        Expense.objects.create(
            user=self.user,
            title='Supermarket',
            category='FOOD',
            amount=3000.00,
            expense_date=today,
            description='Weekly food supplies'
        )
        Expense.objects.create(
            user=self.user,
            title='Electricity Bill',
            category='BILLS',
            amount=1500.00,
            expense_date=today,
            description='Monthly utility'
        )

        # Budget
        Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=5000.00,
            month=today.month,
            year=today.year
        )

        # Savings Goal
        SavingsGoal.objects.create(
            user=self.user,
            goal_name='Emergency Fund',
            target_amount=10000.00,
            saved_amount=4000.00,
            target_date=date(today.year, 12, 31),
            status='IN_PROGRESS'
        )

    def test_monthly_financial_report_api(self):
        """Task 2 - Monthly Financial Report API"""
        response = self.client.get('/api/reports/monthly-financial/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data['total_income'], 12000.0)
        self.assertEqual(data['total_expense'], 4500.0)
        self.assertEqual(data['current_balance'], 7500.0)
        self.assertEqual(data['total_savings'], 4000.0)
        # Budget = 5000, spent on FOOD = 3000 -> remaining = 2000
        self.assertEqual(data['remaining_budget'], 2000.0)

    def test_expense_report_api(self):
        """Task 3 - Expense Report API"""
        response = self.client.get('/api/reports/expenses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data['count'], 2)
        self.assertEqual(data['total_expense'], 4500.0)
        first_expense = data['expenses'][0]

        for field in ['title', 'category', 'amount', 'date', 'description']:
            self.assertIn(field, first_expense)

    def test_savings_report_api(self):
        """Task 4 - Savings Report API"""
        response = self.client.get('/api/reports/savings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data['total_goals'], 1)
        goal = data['savings_reports'][0]

        self.assertEqual(goal['goal_name'], 'Emergency Fund')
        self.assertEqual(goal['target_amount'], 10000.0)
        self.assertEqual(goal['saved_amount'], 4000.0)
        self.assertEqual(goal['remaining_amount'], 6000.0)
        self.assertEqual(goal['progress_percentage'], 40.0)
        self.assertEqual(goal['status'], 'IN_PROGRESS')

    def test_full_financial_summary_report_api(self):
        """Task 5 - Combined Financial Summary Report API"""
        response = self.client.get('/api/reports/financial-summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertIn('financial_summary', data)
        self.assertIn('expense_summary', data)
        self.assertIn('income_summary', data)
        self.assertIn('budget_summary', data)
        self.assertIn('savings_summary', data)
        self.assertIn('latest_notifications', data)

    def test_date_filters(self):
        """Task 6 - Test Date Filters (previous_month, custom)"""
        # Test previous_month
        res_prev = self.client.get('/api/reports/monthly-financial/?filter_type=previous_month')
        self.assertEqual(res_prev.status_code, status.HTTP_200_OK)

        # Test custom date range
        res_custom = self.client.get(
            '/api/reports/expenses/?filter_type=custom&start_date=2026-01-01&end_date=2026-12-31'
        )
        self.assertEqual(res_custom.status_code, status.HTTP_200_OK)
        self.assertEqual(res_custom.data['count'], 2)

    def test_csv_export(self):
        """Task 7 - Test CSV Export"""
        # Test Expense CSV Export
        res_csv_exp = self.client.get('/api/reports/expenses/?export=csv')
        self.assertEqual(res_csv_exp.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv_exp['Content-Type'], 'text/csv')
        self.assertIn('attachment', res_csv_exp['Content-Disposition'])

        # Test Export API Endpoint
        res_export_api = self.client.get('/api/reports/export/', {'type': 'expenses', 'export_format': 'csv'})
        self.assertEqual(res_export_api.status_code, status.HTTP_200_OK)
        self.assertEqual(res_export_api['Content-Type'], 'text/csv')

    def test_jwt_protection(self):
        """All report endpoints require JWT token"""
        self.client.credentials()  # Clear credentials

        urls = [
            '/api/reports/monthly-financial/',
            '/api/reports/expenses/',
            '/api/reports/savings/',
            '/api/reports/financial-summary/',
            '/api/reports/export/',
        ]

        for url in urls:
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
