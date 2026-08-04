import api from './api';

export const getFinancialSummary = async () => {
  const response = await api.get('/analytics/financial-summary/');
  return response.data;
};

export const getCategoryExpenses = async () => {
  const response = await api.get('/analytics/category-expenses/');
  return response.data;
};

export const getMonthlyTrend = async () => {
  const response = await api.get('/analytics/monthly-trend/');
  return response.data;
};

export const getExpenseStats = async () => {
  const response = await api.get('/analytics/expense-stats/');
  return response.data;
};

export const getDashboardData = async () => {
  const response = await api.get('/analytics/dashboard/');
  return response.data;
};
