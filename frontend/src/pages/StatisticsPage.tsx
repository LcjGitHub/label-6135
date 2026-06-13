import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchStats } from '../api/podcasts';
import type { PlatformStats } from '../types';

/** 统计概览页 */
export default function StatisticsPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  function handlePlatformClick(platform: string) {
    navigate(`/?platform=${encodeURIComponent(platform)}`);
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">加载失败，请确认后端已在 7000 端口启动。</Alert>;
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            数据统计概览
          </Typography>
          <Typography variant="body2" color="text.secondary">
            播客与单集数据汇总
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PodcastsIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  播客总数
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {stats?.total_podcasts ?? 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'secondary.light',
                  color: 'secondary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MusicNoteIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  单集总数
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {stats?.total_episodes ?? 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Typography variant="h5" fontWeight={600} gutterBottom mb={2}>
        各平台数据
      </Typography>

      {stats?.platform_stats?.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              暂无平台数据，先去播客列表添加一些节目吧。
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
          }}
        >
          {stats?.platform_stats?.map((item: PlatformStats) => (
            <Card key={item.platform} variant="outlined">
              <CardActionArea onClick={() => handlePlatformClick(item.platform)} sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip label={item.platform} color="primary" variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    播客数量
                  </Typography>
                  <Typography variant="h5" fontWeight={600} gutterBottom mb={2}>
                    {item.podcast_count} 档
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    平均评分
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Rating value={item.avg_rating / 2} precision={0.5} readOnly size="small" />
                    <Typography variant="body1" fontWeight={600}>
                      {item.avg_rating.toFixed(1)}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}
