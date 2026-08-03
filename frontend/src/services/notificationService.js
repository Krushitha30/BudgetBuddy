import api from './api';

export const getNotifications = async (isRead = null) => {
  let url = '/notifications/';
  if (isRead !== null) {
    url += `?is_read=${isRead}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read/`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.post('/notifications/read-all/');
  return response.data;
};

export const deleteNotification = async (id) => {
  await api.delete(`/notifications/${id}/`);
};
