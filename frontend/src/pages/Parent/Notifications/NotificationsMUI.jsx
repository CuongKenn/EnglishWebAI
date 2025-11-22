import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../../services/notificationService';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Button,
  Divider,
  Skeleton,
  Stack,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';

const NotificationsMUI = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [filterType, filterRead]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterType !== 'all') {
        params.notification_type = filterType;
      }
      
      if (filterRead === 'unread') {
        params.unread_only = true;
      }
      
      const data = await notificationService.getNotifications(params);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showSnackbar('Lỗi khi tải thông báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
      showSnackbar('Đã đánh dấu đã đọc', 'success');
    } catch (error) {
      console.error('Error marking as read:', error);
      showSnackbar('Lỗi khi đánh dấu đã đọc', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      await loadUnreadCount();
      showSnackbar('Đã đánh dấu tất cả đã đọc', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showSnackbar('Lỗi khi đánh dấu tất cả đã đọc', 'error');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
      await loadUnreadCount();
      showSnackbar('Đã xóa thông báo', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showSnackbar('Lỗi khi xóa thông báo', 'error');
    }
    handleCloseMenu();
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAllNotifications();
      await loadNotifications();
      await loadUnreadCount();
      showSnackbar('Đã xóa tất cả thông báo', 'success');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      showSnackbar('Lỗi khi xóa tất cả thông báo', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenMenu = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return <InfoIcon />;
      case 'success':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'info':
        return 'Thông tin';
      case 'success':
        return 'Thành công';
      case 'warning':
        return 'Cảnh báo';
      case 'error':
        return 'Lỗi';
      default:
        return 'Khác';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 3, 
          mb: 3,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="600">
                Thông báo
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </Typography>
            </Box>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ fontSize: 40 }} />
            </Badge>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="md">
        {/* Filter Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={filterRead}
            onChange={(e, newValue) => setFilterRead(newValue)}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Tất cả" value="all" />
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Chưa đọc
                </Badge>
              } 
              value="unread" 
            />
          </Tabs>
        </Paper>

        {/* Type Filter */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FilterIcon color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Loại:
            </Typography>
            <Chip 
              label="Tất cả" 
              onClick={() => setFilterType('all')}
              color={filterType === 'all' ? 'primary' : 'default'}
              size="small"
            />
            <Chip 
              label="Thông tin" 
              onClick={() => setFilterType('info')}
              color={filterType === 'info' ? 'info' : 'default'}
              size="small"
            />
            <Chip 
              label="Thành công" 
              onClick={() => setFilterType('success')}
              color={filterType === 'success' ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label="Cảnh báo" 
              onClick={() => setFilterType('warning')}
              color={filterType === 'warning' ? 'warning' : 'default'}
              size="small"
            />
            <Chip 
              label="Lỗi" 
              onClick={() => setFilterType('error')}
              color={filterType === 'error' ? 'error' : 'default'}
              size="small"
            />
          </Box>
        </Paper>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Đánh dấu tất cả đã đọc
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteAll}
            >
              Xóa tất cả
            </Button>
          </Box>
        )}

        {/* Notifications List */}
        <Paper sx={{ borderRadius: 2 }}>
          {notifications.length > 0 ? (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                      transition: 'background-color 0.2s',
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={(e) => handleOpenMenu(e, notification)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getNotificationColor(notification.type)}.main`,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={notification.is_read ? 400 : 600}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.is_read && (
                            <Chip 
                              label="Mới" 
                              size="small" 
                              color="primary" 
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip 
                              label={getNotificationTypeLabel(notification.type)}
                              size="small"
                              color={getNotificationColor(notification.type)}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.created_at).toLocaleString('vi-VN')}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Không có thông báo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filterRead === 'unread' 
                  ? 'Bạn đã đọc tất cả thông báo' 
                  : 'Chưa có thông báo nào'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedNotification && !selectedNotification.is_read && (
          <MenuItem onClick={() => {
            handleMarkAsRead(selectedNotification.id);
            handleCloseMenu();
          }}>
            <CheckIcon sx={{ mr: 1 }} />
            Đánh dấu đã đọc
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDelete(selectedNotification?.id)}>
          <DeleteIcon sx={{ mr: 1 }} color="error" />
          <Typography color="error">Xóa</Typography>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationsMUI;
