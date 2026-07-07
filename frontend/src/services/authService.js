import api from './api';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const register = async (username, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/users/register/`, {
    username,
    email,
    password,
  });
  return response.data;
};

export const login = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/token/`, {
    username,
    password,
  });
  const { access, refresh } = response.data;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  return response.data;
};

export const logout = async () => {
  const refresh = localStorage.getItem('refresh_token');
  try {
    await api.post('/users/logout/', { refresh });
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

export const getProfile = async () => {
  const response = await api.get('/users/profile/');
  return response.data;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};
