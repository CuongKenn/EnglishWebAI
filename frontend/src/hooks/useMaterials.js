// hooks/useMaterials.js
import { useState, useEffect } from 'react';
import { materialsAPI } from '../services/api';

/**
 * Custom hook để quản lý materials
 */
export const useMaterials = (params = {}) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialsAPI.getMaterials(params);
      setMaterials(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách học liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [JSON.stringify(params)]);

  return {
    materials,
    loading,
    error,
    refetch: fetchMaterials,
  };
};

/**
 * Custom hook để lấy chi tiết material
 */
export const useMaterialDetail = (materialId) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMaterialDetail = async () => {
    if (!materialId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await materialsAPI.getMaterialDetail(materialId);
      setMaterial(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin học liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialDetail();
  }, [materialId]);

  const updateProgress = async (progress) => {
    setLoading(true);
    setError(null);
    try {
      await materialsAPI.updateProgress(materialId, progress);
      await fetchMaterialDetail(); // Refresh
      return true;
    } catch (err) {
      setError(err.message || 'Không thể cập nhật tiến độ');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const downloadMaterial = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await materialsAPI.downloadMaterial(materialId);
      return result;
    } catch (err) {
      setError(err.message || 'Không thể tải xuống học liệu');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    material,
    loading,
    error,
    refetch: fetchMaterialDetail,
    updateProgress,
    downloadMaterial,
  };
};
