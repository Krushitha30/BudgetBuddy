from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from .models import Notification
from savings.models import SavingsGoal
from budgets.models import Budget


class NotificationAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        response = self.client.post('/api/token/', {'username': 'testuser', 'password': 'testpass123'})
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_notification(self):
        """Task 4 - Create a Notification via API."""
        data = {
            'title': 'Test Title',
            'message': 'Test Message',
            'notification_type': 'GENERAL',
            'priority': 'LOW'
        }
        response = self.client.post('/api/notifications/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Title')
        self.assertFalse(response.data['is_read'])

    def test_view_notifications(self):
        """Task 4 - View Notifications."""
        Notification.objects.create(
            user=self.user, title='Notif 1', message='Msg 1', notification_type='GENERAL'
        )
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_update_notification(self):
        """Task 4 - Update Notification."""
        notif = Notification.objects.create(
            user=self.user, title='Old Title', message='Old Msg', notification_type='GENERAL'
        )
        response = self.client.patch(f'/api/notifications/{notif.id}/', {'title': 'New Title'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'New Title')

    def test_delete_notification(self):
        """Task 4 - Delete Notification."""
        notif = Notification.objects.create(
            user=self.user, title='To Delete', message='Msg', notification_type='GENERAL'
        )
        response = self.client.delete(f'/api/notifications/{notif.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_mark_as_read_api(self):
        """Task 5 - Mark as Read API changes is_read = False to is_read = True."""
        notif = Notification.objects.create(
            user=self.user, title='Unread Notif', message='Msg', is_read=False
        )
        self.assertFalse(notif.is_read)

        response = self.client.patch(f'/api/notifications/{notif.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['notification']['is_read'])

        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_as_read_api(self):
        """Task 5 - Mark All as Read API."""
        Notification.objects.create(user=self.user, title='N1', message='M1', is_read=False)
        Notification.objects.create(user=self.user, title='N2', message='M2', is_read=False)

        response = self.client.post('/api/notifications/read-all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=self.user, is_read=False).count(), 0)

    def test_automatic_notification_savings_goal_created(self):
        """Task 6 - Auto notification on Savings Goal Created."""
        target_date = str(date.today() + timedelta(days=30))
        self.client.post('/api/savings/', {
            'goal_name': 'Emergency Fund',
            'target_amount': '10000.00',
            'target_date': target_date
        }, format='json')

        notifs = Notification.objects.filter(user=self.user, notification_type='SAVINGS')
        self.assertTrue(notifs.filter(title='New Savings Goal Created').exists())

    def test_automatic_notification_savings_goal_completed(self):
        """Task 6 - Auto notification on Savings Goal Completed."""
        target_date = date.today() + timedelta(days=30)
        goal = SavingsGoal.objects.create(
            user=self.user, goal_name='Phone Fund',
            target_amount=10000, saved_amount=5000,
            target_date=target_date, status='IN_PROGRESS'
        )

        self.client.patch(f'/api/savings/{goal.id}/', {'saved_amount': '10000.00'}, format='json')

        notifs = Notification.objects.filter(user=self.user, title='Savings Goal Completed!')
        self.assertTrue(notifs.exists())

    def test_automatic_notification_budget_created(self):
        """Task 6 - Auto notification on Budget Created."""
        self.client.post('/api/budgets/', {
            'category': 'HEALTHCARE',
            'budget_amount': '500.00',
            'month': 8,
            'year': 2026
        }, format='json')

        notifs = Notification.objects.filter(user=self.user, notification_type='BUDGET')
        self.assertTrue(notifs.filter(title='Budget Created').exists())

    def test_automatic_notification_budget_updated(self):
        """Task 6 - Auto notification on Budget Updated."""
        budget = Budget.objects.create(
            user=self.user, category='BILLS', budget_amount=1000, month=8, year=2026
        )

        self.client.patch(f'/api/budgets/{budget.id}/', {'budget_amount': '1200.00'}, format='json')

        notifs = Notification.objects.filter(user=self.user, title='Budget Updated')
        self.assertTrue(notifs.exists())

    def test_jwt_protection(self):
        """JWT authentication protection."""
        self.client.credentials()  # Clear auth token
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
