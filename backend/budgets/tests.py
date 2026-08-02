from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Budget
from expenses.models import Expense

class BudgetAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.other_user = User.objects.create_user(username='otheruser', password='otherpassword')

        # Log in using JWT
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Create basic budget for self.user
        self.budget1 = Budget.objects.create(
            user=self.user,
            category='FOOD',
            budget_amount=200.00,
            month=7,
            year=2026
        )

        # Create expense records for self.user in same month/year
        self.expense1 = Expense.objects.create(
            user=self.user,
            title='Dinner',
            category='FOOD',
            amount=50.00,
            expense_date='2026-07-10'
        )
        self.expense2 = Expense.objects.create(
            user=self.user,
            title='Lunch',
            category='FOOD',
            amount=70.00,
            expense_date='2026-07-15'
        )

        # Create expense in different month to test isolation
        self.expense_diff_month = Expense.objects.create(
            user=self.user,
            title='Groceries',
            category='FOOD',
            amount=30.00,
            expense_date='2026-08-01'
        )

        # URLs
        self.list_create_url = reverse('budget-list-create')
        self.summary_url = reverse('budget-summary')

    def test_create_budget_success(self):
        data = {
            'category': 'TRAVEL',
            'budget_amount': 300.00,
            'month': 7,
            'year': 2026
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['category'], 'TRAVEL')
        self.assertEqual(float(response.data['budget_amount']), 300.00)

    def test_create_budget_invalid_category(self):
        data = {
            'category': 'INVALID_CATEGORY',
            'budget_amount': 300.00,
            'month': 7,
            'year': 2026
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_budget_invalid_month(self):
        data = {
            'category': 'FOOD',
            'budget_amount': 300.00,
            'month': 13,
            'year': 2026
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_budget_duplicate_validation(self):
        data = {
            'category': 'FOOD',
            'budget_amount': 400.00,
            'month': 7,
            'year': 2026
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_budgets_isolation(self):
        Budget.objects.create(
            user=self.other_user,
            category='FOOD',
            budget_amount=500.00,
            month=7,
            year=2026
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(float(response.data[0]['budget_amount']), 200.00)

    def test_update_budget(self):
        detail_url = reverse('budget-detail', kwargs={'pk': self.budget1.pk})
        data = {'budget_amount': 250.00}
        response = self.client.patch(detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['budget_amount']), 250.00)

    def test_delete_budget(self):
        detail_url = reverse('budget-detail', kwargs={'pk': self.budget1.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Budget.objects.filter(pk=self.budget1.pk).exists())

    def test_budget_summary_under_budget(self):
        response = self.client.get(self.summary_url, {'category': 'FOOD', 'month': 7, 'year': 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['budget_amount'], 200.00)
        self.assertEqual(response.data['total_expense'], 120.00)
        self.assertEqual(response.data['remaining_budget'], 80.00)
        self.assertEqual(response.data['overspent_amount'], 0.00)

    def test_budget_summary_over_budget(self):
        Expense.objects.create(
            user=self.user,
            title='Groceries 2',
            category='FOOD',
            amount=100.00,
            expense_date='2026-07-20'
        )
        response = self.client.get(self.summary_url, {'category': 'FOOD', 'month': 7, 'year': 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['budget_amount'], 200.00)
        self.assertEqual(response.data['total_expense'], 220.00)
        self.assertEqual(response.data['remaining_budget'], 0.00)
        self.assertEqual(response.data['overspent_amount'], 20.00)

    def test_budget_summary_no_budget_set(self):
        response = self.client.get(self.summary_url, {'category': 'TRAVEL', 'month': 7, 'year': 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['budget_amount'], 0.00)
        self.assertEqual(response.data['total_expense'], 0.00)
        self.assertEqual(response.data['remaining_budget'], 0.00)
        self.assertEqual(response.data['overspent_amount'], 0.00)

    def test_jwt_protection(self):
        self.client.credentials()
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
