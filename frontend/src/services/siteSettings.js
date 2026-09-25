import api from './api';

export const siteSettingsApi = {
  get: () => api.get('/site-settings').then((r) => r.data.settings),
  update: (payload) => api.patch('/site-settings', payload).then((r) => r.data.settings),
  uploadLogo: (formData) =>
    api.post('/site-settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.settings),
  removeLogo: () => api.delete('/site-settings/logo').then((r) => r.data.settings),
  getPaymentSettings: () => api.get('/site-settings/payment').then((r) => r.data),
  updatePaymentSettings: (payload) => api.patch('/site-settings/payment', payload).then((r) => r.data.paymentSettings),
  saveCodAdvancePercentage: (codAdvancePercentage) => api.patch('/site-settings/payment', { codAdvancePercentage }).then((r) => r.data.codAdvancePercentage),
};
