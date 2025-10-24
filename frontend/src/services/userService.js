import { apiV1 } from './api';

export const getCurrentUser = async () => {
  const res = await apiV1.get('/users/me');
  return res.data;
};

export const linkParent = async (parentEmail) => {
  const res = await apiV1.post('/users/me/link-parent', {
    parent_email: parentEmail
  });
  return res.data;
};

export const unlinkParent = async (parentId) => {
  const res = await apiV1.delete(`/users/me/unlink-parent/${parentId}`);
  return res.data;
};

export const getMyParents = async () => {
  const res = await apiV1.get('/users/me/parents');
  return res.data;
};

export const verifyParentLink = async (parentId) => {
  const res = await apiV1.post(`/users/me/verify-parent/${parentId}`);
  return res.data;
};

