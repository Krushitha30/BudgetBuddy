from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Income
from expenses.models import Expense

class IncomeAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.other_user = User.objects.create_user(username='otheruser', password='otherpassword')
        
        # Log in using JWT
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test income for self.user
        self.income1 = Income.objects.create(
            user=self.user,
            title='Monthly Salary',
            source='SALARY',
            amount=3000.00,
            income_date='2026-07-01'
        )
        self.income2 = Income.objects.create(
            user=self.user,
            title='Website Design Freelance',
            source='FREELANCING',
            amount=500.00,
            income_date='2026-07-05'
        )
        
        # Create test expenses for self.user (for Summary testing)
        self.expense1 = Expense.objects.create(
            user=self.user,
            title='Rent payment',
            category='BILLS',
            amount=1000.00,
            expense_date='2026-07-02'
        )
        self.expense2 = Expense.objects.create(
            user=self.user,
            title='Dinner out',
            category='FOOD',
            amount=50.00,
            expense_date='2026-07-03'
        )

        # Create income for other_user to verify data isolation
        self.other_income = Income.objects.create(
            user=self.other_user,
            title='Other User Salary',
            source='SALARY',
            amount=4000.00,
            income_date='2026-07-01'
        )
        
        # URLs
        self.list_create_url = reverse('income-list-create')
        self.summary_url = reverse('income-summary')

    def test_create_income(self):
        data = {
            'title': 'Tutoring Gig',
            'source': 'FREELANCING',
            'amount': 150.00,
            'income_date': '2026-07-10',
            'description': 'Helped student with math'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Tutoring Gig')
        self.assertEqual(response.data['source'], 'FREELANCING')
        self.assertEqual(float(response.data['amount']), 150.00)

    def test_create_income_invalid_source(self):
        data = {
            'title': 'Gifts',
            'source': 'INVALID_SOURCE',
            'amount': 50.00,
            'income_date': '2026-07-10'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_income_isolation(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return 2 income objects for self.user (income1, income2)
        self.assertEqual(len(response.data), 2)
        
    def test_retrieve_income(self):
        detail_url = reverse('income-detail', kwargs={'pk': self.income1.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Monthly Salary')

    def test_update_income(self):
        detail_url = reverse('income-detail', kwargs={'pk': self.income1.pk})
        data = {'amount': 3200.00}
        response = self.client.patch(detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['amount']), 3200.00)

    def test_delete_income(self):
        detail_url = reverse('income-detail', kwargs={'pk': self.income1.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Income.objects.filter(pk=self.income1.pk).exists())

    def test_financial_summary(self):
        # total_income = 3000 + 500 = 3500.00
        # total_expense = 1000 + 50 = 1050.00
        # current_balance = 3500 - 1050 = 2450.00
        response = self.client.get(self.summary_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_income'], 3500.00)
        self.assertEqual(response.data['total_expense'], 1050.00)
        self.assertEqual(response.data['current_balance'], 2450.00)

    def test_unauthenticated_access(self):
        # Clear JWT authentication header
        self.client.credentials()
        
        response_list = self.client.get(self.list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response_summary = self.client.get(self.summary_url)
        self.assertEqual(response_summary.status_code, status.HTTP_401_UNAUTHORIZED)
