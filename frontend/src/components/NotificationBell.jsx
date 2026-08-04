import React, { useState, useEffect, useRef } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../services/notificationService';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll every 10 seconds for real-time notifications
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'SAVINGS': return '🎯 Savings';
      case 'BUDGET': return '💡 Budget';
      case 'EXPENSE': return '💸 Expense';
      case 'SYSTEM': return '⚙️ System';
      default: return '📢 General';
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        className="notif-bell-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifs();
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notifications ({unreadCount} unread)</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item ${item.is_read ? 'read' : 'unread'}`}
                  onClick={(e) => !item.is_read && handleMarkAsRead(item.id, e)}
                >
                  <div className="notif-item-header">
                    <span className="notif-type-tag">{getTypeBadge(item.notification_type)}</span>
                    <span className="notif-time">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="notif-item-title">{item.title}</div>
                  <div className="notif-item-message">{item.message}</div>

                  <div className="notif-item-actions">
                    {!item.is_read && (
                      <span className="notif-mark-single" onClick={(e) => handleMarkAsRead(item.id, e)}>
                        ✓ Mark read
                      </span>
                    )}
                    <span className="notif-delete-single" onClick={(e) => handleDelete(item.id, e)}>
                      🗑️ Delete
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
