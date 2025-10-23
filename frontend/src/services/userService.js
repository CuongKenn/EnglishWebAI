import { apiV1 } from './api';

export const getCurrentUser = async () => {
  const res = await apiV1.get('/users/me');
  return res.data;
};

