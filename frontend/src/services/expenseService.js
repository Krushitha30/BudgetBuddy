import api from './api';

export const getExpenses = async (params) => {
  const response = await api.get('/expenses/', { params });
  return response.data;
};

export const createExpense = async (data) => {
  const response = await api.post('/expenses/', data);
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await api.patch(`/expenses/${id}/`, data);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}/`);
  return response.data;
};

export const getExpenseTotal = async (params) => {
  const response = await api.get('/expenses/total/', { params });
  return response.data;
};
