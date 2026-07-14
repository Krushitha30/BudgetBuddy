from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Expense

class ExpenseAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.other_user = User.objects.create_user(username='otheruser', password='otherpassword')
        
        # Log in the main user using JWT
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test expenses for self.user
        self.expense1 = Expense.objects.create(
            user=self.user,
            title='Dinner',
            category='FOOD',
            amount=50.00,
            expense_date='2026-07-01'
        )
        self.expense2 = Expense.objects.create(
            user=self.user,
            title='Uber ride',
            category='TRAVEL',
            amount=20.00,
            expense_date='2026-07-05'
        )
        self.expense3 = Expense.objects.create(
            user=self.user,
            title='Groceries',
            category='FOOD',
            amount=80.00,
            expense_date='2026-07-03'
        )
        
        # Create an expense for other_user to verify isolation
        self.other_expense = Expense.objects.create(
            user=self.other_user,
            title='Secret Rent',
            category='BILLS',
            amount=1000.00,
            expense_date='2026-07-01'
        )
        
        # URLs
        self.list_create_url = reverse('expense-list-create')
        self.total_url = reverse('expense-total')

    def test_create_expense(self):
        data = {
            'title': 'Books',
            'category': 'EDUCATION',
            'amount': 45.50,
            'expense_date': '2026-07-10',
            'description': 'Textbooks for semester'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Books')
        self.assertEqual(response.data['category'], 'EDUCATION')
        self.assertEqual(float(response.data['amount']), 45.50)

    def test_create_expense_invalid_category(self):
        data = {
            'title': 'Books',
            'category': 'INVALID_CAT',
            'amount': 45.50,
            'expense_date': '2026-07-10'
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_expenses_isolation(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only list self.user's 3 expenses, not other_user's expense
        self.assertEqual(len(response.data), 3)

    def test_retrieve_expense(self):
        detail_url = reverse('expense-detail', kwargs={'pk': self.expense1.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Dinner')

    def test_update_expense(self):
        detail_url = reverse('expense-detail', kwargs={'pk': self.expense1.pk})
        data = {'amount': 60.00}
        response = self.client.patch(detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['amount']), 60.00)

    def test_delete_expense(self):
        detail_url = reverse('expense-detail', kwargs={'pk': self.expense1.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Expense.objects.filter(pk=self.expense1.pk).exists())

    def test_filter_by_category(self):
        response = self.client.get(self.list_create_url, {'category': 'FOOD'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        titles = [item['title'] for item in response.data]
        self.assertIn('Dinner', titles)
        self.assertIn('Groceries', titles)
        self.assertNotIn('Uber ride', titles)

    def test_sort_latest(self):
        # Default latest (2026-07-05 first, then 2026-07-03, then 2026-07-01)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Uber ride')
        self.assertEqual(response.data[1]['title'], 'Groceries')
        self.assertEqual(response.data[2]['title'], 'Dinner')

    def test_sort_oldest(self):
        response = self.client.get(self.list_create_url, {'sort': 'oldest'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Dinner')
        self.assertEqual(response.data[1]['title'], 'Groceries')
        self.assertEqual(response.data[2]['title'], 'Uber ride')

    def test_sort_highest_amount(self):
        response = self.client.get(self.list_create_url, {'sort': 'highest_amount'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Groceries')
        self.assertEqual(response.data[1]['title'], 'Dinner')
        self.assertEqual(response.data[2]['title'], 'Uber ride')

    def test_sort_lowest_amount(self):
        response = self.client.get(self.list_create_url, {'sort': 'lowest_amount'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Uber ride')
        self.assertEqual(response.data[1]['title'], 'Dinner')
        self.assertEqual(response.data[2]['title'], 'Groceries')

    def test_total_expenses(self):
        response = self.client.get(self.total_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Total should be 50 + 20 + 80 = 150.00
        self.assertEqual(response.data['total_expense'], 150.00)

    def test_total_expenses_with_category_filter(self):
        response = self.client.get(self.total_url, {'category': 'FOOD'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # FOOD total should be 50 + 80 = 130.00
        self.assertEqual(response.data['total_expense'], 130.00)
