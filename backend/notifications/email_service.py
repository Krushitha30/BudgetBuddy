import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_notification_email(notification):
    """
    Sends an email notification to the user associated with the notification instance.
    Supports both HTML and Plain Text formatting.
    """
    user = notification.user
    if not user or not user.email:
        return False

    subject = f"[BudgetBuddy] {notification.title}"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@budgetbuddy.com')
    recipient_list = [user.email]

    # Plain text message
    plain_message = (
        f"Hello {user.username},\n\n"
        f"{notification.message}\n\n"
        f"Details:\n"
        f"- Type: {notification.get_notification_type_display() if hasattr(notification, 'get_notification_type_display') else notification.notification_type}\n"
        f"- Priority: {notification.priority}\n"
        f"- Time: {notification.created_at.strftime('%Y-%m-%d %H:%M') if notification.created_at else 'Just now'}\n\n"
        f"Best regards,\n"
        f"BudgetBuddy Team"
    )

    # HTML formatted message
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }}
        .card {{ background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 550px; margin: 0 auto; }}
        .header {{ font-size: 20px; font-weight: bold; color: #38bdf8; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 12px; }}
        .content {{ font-size: 15px; line-height: 1.6; color: #e2e8f0; margin-bottom: 20px; }}
        .meta {{ background-color: #0f172a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #94a3b8; margin-bottom: 20px; }}
        .meta div {{ margin-bottom: 4px; }}
        .footer {{ font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 12px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">🔔 {notification.title}</div>
        <div class="content">
          <p>Hello <strong>{user.username}</strong>,</p>
          <p>{notification.message}</p>
        </div>
        <div class="meta">
          <div><strong>Category:</strong> {notification.notification_type}</div>
          <div><strong>Priority:</strong> {notification.priority}</div>
          <div><strong>Date:</strong> {notification.created_at.strftime('%Y-%m-%d %H:%M') if notification.created_at else 'Just now'}</div>
        </div>
        <div class="footer">
          Sent by BudgetBuddy &bull; Personal Budget Planning & Expense Management
        </div>
      </div>
    </body>
    </html>
    """

    try:
        sent_count = send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=True,
        )
        return sent_count > 0
    except Exception as e:
        logger.error(f"Failed to send email notification to {user.email}: {e}")
        return False
