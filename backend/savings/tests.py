from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from .models import SavingsGoal


class SavingsGoalTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        response = self.client.post('/api/token/', {'username': 'testuser', 'password': 'testpass123'})
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.future_date = str(date.today() + timedelta(days=60))
        self.past_date = str(date.today() - timedelta(days=1))

    def test_create_savings_goal(self):
        """Task 4 - Create a Savings Goal."""
        data = {
            'goal_name': 'Laptop Fund',
            'target_amount': '50000.00',
            'saved_amount': '5000.00',
            'target_date': self.future_date,
        }
        response = self.client.post('/api/savings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['goal_name'], 'Laptop Fund')

    def test_view_all_savings_goals(self):
        """Task 4 - View all Savings Goals."""
        SavingsGoal.objects.create(
            user=self.user, goal_name='Travel Fund',
            target_amount=20000, saved_amount=5000,
            target_date=date.today() + timedelta(days=90)
        )
        response = self.client.get('/api/savings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_update_savings_goal(self):
        """Task 4 - Update a Savings Goal."""
        goal = SavingsGoal.objects.create(
            user=self.user, goal_name='Emergency Fund',
            target_amount=10000, saved_amount=2000,
            target_date=date.today() + timedelta(days=30)
        )
        response = self.client.patch(f'/api/savings/{goal.id}/', {'saved_amount': '5000.00'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['saved_amount']), 5000.00)

    def test_delete_savings_goal(self):
        """Task 4 - Delete a Savings Goal."""
        goal = SavingsGoal.objects.create(
            user=self.user, goal_name='Bike Fund',
            target_amount=15000, saved_amount=0,
            target_date=date.today() + timedelta(days=45)
        )
        response = self.client.delete(f'/api/savings/{goal.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_goal_progress_api(self):
        """Task 5 - Goal Progress API returns correct calculations."""
        goal = SavingsGoal.objects.create(
            user=self.user, goal_name='Vacation',
            target_amount=10000, saved_amount=2500,
            target_date=date.today() + timedelta(days=60)
        )
        response = self.client.get(f'/api/savings/{goal.id}/progress/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['remaining_amount'], 7500.0)
        self.assertEqual(response.data['progress_percentage'], 25.0)

    def test_validation_target_amount_zero(self):
        """Task 6 - Target amount must be greater than zero."""
        data = {
            'goal_name': 'Bad Goal',
            'target_amount': '0.00',
            'saved_amount': '0.00',
            'target_date': self.future_date,
        }
        response = self.client.post('/api/savings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_negative_saved_amount(self):
        """Task 6 - Saved amount cannot be negative."""
        data = {
            'goal_name': 'Bad Goal',
            'target_amount': '5000.00',
            'saved_amount': '-100.00',
            'target_date': self.future_date,
        }
        response = self.client.post('/api/savings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_past_target_date(self):
        """Task 6 - Target date cannot be in the past."""
        data = {
            'goal_name': 'Past Goal',
            'target_amount': '5000.00',
            'saved_amount': '0.00',
            'target_date': self.past_date,
        }
        response = self.client.post('/api/savings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_jwt_protection(self):
        """All APIs must be protected by JWT."""
        self.client.credentials()  # Remove token
        response = self.client.get('/api/savings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_isolation(self):
        """Users should only see their own savings goals."""
        other_user = User.objects.create_user(username='otheruser', password='testpass123')
        SavingsGoal.objects.create(
            user=other_user, goal_name='Other User Goal',
            target_amount=5000, saved_amount=0,
            target_date=date.today() + timedelta(days=30)
        )
        response = self.client.get('/api/savings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for goal in response.data:
            self.assertNotEqual(goal['goal_name'], 'Other User Goal')
