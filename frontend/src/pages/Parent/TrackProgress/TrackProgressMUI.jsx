import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../../services/parentService';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Avatar,
  Chip,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as AwardIcon,
  MenuBook as BookOpenIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const TrackProgressMUI = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const data = await parentAPI.getChildren();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
        loadProgress(data[0].id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (childId) => {
    try {
      const data = await parentAPI.getChildProgress(childId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleChildChange = (event) => {
    const child = children.find(c => c.id === event.target.value);
    setSelectedChild(child);
    loadProgress(child.id);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
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
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="600">
                Theo dõi tiến độ học tập
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Xem chi tiết quá trình học tập của con
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {/* Child Selector */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Chọn học sinh</InputLabel>
            <Select
              value={selectedChild?.id || ''}
              onChange={handleChildChange}
              label="Chọn học sinh"
            >
              {children.map((child) => (
                <MenuItem key={child.id} value={child.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {child.full_name?.charAt(0) || <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{child.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {child.email}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {progress && (
          <Grid container spacing={3}>
            {/* Overview Stats */}
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BookOpenIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Lớp học
                    </Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="600" color="primary">
                    {progress.total_classes || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tổng số lớp đã tham gia
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <AwardIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Điểm TB
                    </Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="600" color="success.main">
                    {progress.average_score?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Điểm trung bình các bài tập
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <CalendarIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Điểm danh
                    </Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="600" color="warning.main">
                    {progress.attendance_rate?.toFixed(0) || '0'}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tỷ lệ tham gia lớp học
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary">
                      Hoàn thành
                    </Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="600" color="info.main">
                    {progress.completed_exercises || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Bài tập đã hoàn thành
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Classes Progress */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                    Chi tiết theo lớp học
                  </Typography>
                  
                  {progress.classes && progress.classes.length > 0 ? (
                    <Grid container spacing={2}>
                      {progress.classes.map((classItem, index) => (
                        <Grid item xs={12} key={index}>
                          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6" fontWeight="600">
                                  {classItem.class_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {classItem.teacher_name}
                                </Typography>
                              </Box>
                              <Chip 
                                label={`${classItem.average_score?.toFixed(1) || '0.0'} điểm`}
                                color={getScoreColor(classItem.average_score)}
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Tỷ lệ hoàn thành
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={classItem.completion_rate || 0}
                                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                    color={getScoreColor(classItem.completion_rate)}
                                  />
                                  <Typography variant="body2" fontWeight="600">
                                    {classItem.completion_rate?.toFixed(0) || '0'}%
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Bài tập
                                </Typography>
                                <Typography variant="body1" fontWeight="600">
                                  {classItem.completed_exercises || 0} / {classItem.total_exercises || 0}
                                </Typography>
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Điểm danh
                                </Typography>
                                <Typography variant="body1" fontWeight="600">
                                  {classItem.attendance_count || 0} buổi
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        Chưa có dữ liệu lớp học
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activities */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                    Hoạt động gần đây
                  </Typography>
                  
                  {progress.recent_activities && progress.recent_activities.length > 0 ? (
                    <Box>
                      {progress.recent_activities.map((activity, index) => (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              {activity.type === 'exercise' && <BookOpenIcon />}
                              {activity.type === 'attendance' && <CalendarIcon />}
                              {activity.type === 'achievement' && <AwardIcon />}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" fontWeight="500">
                                {activity.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {activity.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.date).toLocaleDateString('vi-VN')}
                              </Typography>
                            </Box>
                            {activity.score && (
                              <Chip 
                                label={`${activity.score} điểm`}
                                size="small"
                                color={getScoreColor(activity.score)}
                              />
                            )}
                          </Box>
                          {index < progress.recent_activities.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        Chưa có hoạt động gần đây
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {!progress && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Không có dữ liệu tiến độ
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default TrackProgressMUI;
