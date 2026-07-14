import api from './api';

export const getIncomes = async () => {
  const response = await api.get('/income/');
  return response.data;
};

export const createIncome = async (data) => {
  const response = await api.post('/income/', data);
  return response.data;
};

export const updateIncome = async (id, data) => {
  const response = await api.patch(`/income/${id}/`, data);
  return response.data;
};

export const deleteIncome = async (id) => {
  const response = await api.delete(`/income/${id}/`);
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get('/income/summary/');
  return response.data;
};
