import api from './api';

export const getSavingsGoals = async () => {
  const response = await api.get('/savings/');
  return response.data;
};

export const createSavingsGoal = async (data) => {
  const response = await api.post('/savings/', data);
  return response.data;
};

export const updateSavingsGoal = async (id, data) => {
  const response = await api.patch(`/savings/${id}/`, data);
  return response.data;
};

export const deleteSavingsGoal = async (id) => {
  await api.delete(`/savings/${id}/`);
};

export const getSavingsGoalProgress = async (id) => {
  const response = await api.get(`/savings/${id}/progress/`);
  return response.data;
};
