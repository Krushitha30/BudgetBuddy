import api from './api';

export const getMonthlyFinancialReport = async (params = {}) => {
  const response = await api.get('/reports/monthly-financial/', { params });
  return response.data;
};

export const getExpenseReport = async (params = {}) => {
  const response = await api.get('/reports/expenses/', { params });
  return response.data;
};

export const getSavingsReport = async (params = {}) => {
  const response = await api.get('/reports/savings/', { params });
  return response.data;
};

export const getFullFinancialSummary = async (params = {}) => {
  const response = await api.get('/reports/financial-summary/', { params });
  return response.data;
};

export const downloadReportCSV = async (type = 'expenses', params = {}) => {
  const response = await api.get('/reports/export/', {
    params: { type, export_format: 'csv', ...params },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `BudgetBuddy_${type}_report.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
