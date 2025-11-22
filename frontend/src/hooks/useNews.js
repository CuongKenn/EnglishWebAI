// hooks/useNews.js
import { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';

/**
 * Custom hook để quản lý news
 */
export const useNews = (params = {}) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await newsAPI.getNews(params);
      setNews(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách tin tức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [JSON.stringify(params)]);

  return {
    news,
    loading,
    error,
    refetch: fetchNews,
  };
};

/**
 * Custom hook để lấy chi tiết tin tức
 */
export const useNewsDetail = (newsId) => {
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNewsDetail = async () => {
    if (!newsId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await newsAPI.getNewsDetail(newsId);
      setNewsItem(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin tin tức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsDetail();
  }, [newsId]);

  return {
    newsItem,
    loading,
    error,
    refetch: fetchNewsDetail,
  };
};
