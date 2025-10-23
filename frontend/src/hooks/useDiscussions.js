// hooks/useDiscussions.js
import { useState, useEffect } from 'react';
import { discussionsAPI } from '../services/api';

/**
 * Custom hook để quản lý discussions
 */
export const useDiscussions = (params = {}) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiscussions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discussionsAPI.getDiscussions(params);
      setDiscussions(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách thảo luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [JSON.stringify(params)]);

  const createDiscussion = async (discussionData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await discussionsAPI.createDiscussion(discussionData);
      await fetchDiscussions(); // Refresh list
      return result;
    } catch (err) {
      setError(err.message || 'Không thể tạo thảo luận');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscussion = async (discussionId) => {
    setLoading(true);
    setError(null);
    try {
      await discussionsAPI.deleteDiscussion(discussionId);
      await fetchDiscussions(); // Refresh list
      return true;
    } catch (err) {
      setError(err.message || 'Không thể xóa thảo luận');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    discussions,
    loading,
    error,
    refetch: fetchDiscussions,
    createDiscussion,
    deleteDiscussion,
  };
};

/**
 * Custom hook để lấy chi tiết discussion
 */
export const useDiscussionDetail = (discussionId) => {
  const [discussion, setDiscussion] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiscussionDetail = async () => {
    if (!discussionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await discussionsAPI.getDiscussionDetail(discussionId);
      setDiscussion(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin thảo luận');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!discussionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await discussionsAPI.getPosts(discussionId);
      setPosts(data);
    } catch (err) {
      setError(err.message || 'Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussionDetail();
    fetchPosts();
  }, [discussionId]);

  const createPost = async (postData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await discussionsAPI.createPost(discussionId, postData);
      await fetchPosts(); // Refresh posts
      return result;
    } catch (err) {
      setError(err.message || 'Không thể tạo bình luận');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    discussion,
    posts,
    loading,
    error,
    refetch: () => {
      fetchDiscussionDetail();
      fetchPosts();
    },
    createPost,
  };
};
