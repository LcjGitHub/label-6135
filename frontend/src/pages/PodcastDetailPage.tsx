import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  createEpisode,
  deleteEpisode,
  fetchPodcast,
  toggleListenStatus,
  updateEpisode,
  updatePodcast,
} from '../api/podcasts';
import type { Episode, EpisodeFormData, PodcastFormData } from '../types';

const EMPTY_EPISODE: EpisodeFormData = { title: '', recommendation: '' };

/** 播客详情页（含单集列表） */
export default function PodcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const podcastId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [podcastDialogOpen, setPodcastDialogOpen] = useState(false);
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [podcastForm, setPodcastForm] = useState<PodcastFormData | null>(null);
  const [episodeForm, setEpisodeForm] = useState<EpisodeFormData>(EMPTY_EPISODE);

  const { data: podcast, isLoading, error } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => fetchPodcast(podcastId),
    enabled: Number.isFinite(podcastId),
  });

  const updatePodcastMutation = useMutation({
    mutationFn: (payload: PodcastFormData) => updatePodcast(podcastId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
      setPodcastDialogOpen(false);
    },
  });

  const saveEpisodeMutation = useMutation({
    mutationFn: (payload: EpisodeFormData) =>
      editingEpisode
        ? updateEpisode(editingEpisode.id, payload)
        : createEpisode(podcastId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
      closeEpisodeDialog();
    },
  });

  const removeEpisodeMutation = useMutation({
    mutationFn: deleteEpisode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
    },
  });

  const toggleListenMutation = useMutation({
    mutationFn: toggleListenStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
    },
  });

  /** 打开播客编辑对话框 */
  function openPodcastEdit() {
    if (!podcast) return;
    setPodcastForm({
      name: podcast.name,
      platform: podcast.platform,
      theme: podcast.theme,
      rating: podcast.rating,
      notes: podcast.notes ?? '',
    });
    setPodcastDialogOpen(true);
  }

  /** 打开新增单集对话框 */
  function openCreateEpisode() {
    setEditingEpisode(null);
    setEpisodeForm(EMPTY_EPISODE);
    setEpisodeDialogOpen(true);
  }

  /**
   * 打开编辑单集对话框
   * @param episode - 待编辑单集
   */
  function openEditEpisode(episode: Episode) {
    setEditingEpisode(episode);
    setEpisodeForm({
      title: episode.title,
      recommendation: episode.recommendation ?? '',
    });
    setEpisodeDialogOpen(true);
  }

  /** 关闭单集对话框 */
  function closeEpisodeDialog() {
    setEpisodeDialogOpen(false);
    setEditingEpisode(null);
    setEpisodeForm(EMPTY_EPISODE);
  }

  /**
   * 删除单集
   * @param episode - 待删除单集
   */
  function handleDeleteEpisode(episode: Episode) {
    if (window.confirm(`确定删除单集「${episode.title}」？`)) {
      removeEpisodeMutation.mutate(episode.id);
    }
  }

  /**
   * 切换单集收听状态
   * @param episodeId - 单集 ID
   */
  function handleToggleListen(episodeId: number) {
    toggleListenMutation.mutate(episodeId);
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !podcast) {
    return (
      <Alert severity="error">
        播客不存在或加载失败。
        <Button component={RouterLink} to="/" sx={{ ml: 2 }}>
          返回列表
        </Button>
      </Alert>
    );
  }

  return (
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        返回列表
      </Button>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {podcast.name}
              </Typography>
              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                <Chip label={podcast.platform} color="primary" variant="outlined" />
                <Chip label={podcast.theme} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <Rating value={podcast.rating / 2} precision={0.5} readOnly />
                <Typography variant="body1">{podcast.rating.toFixed(1)} / 10</Typography>
              </Stack>
              {podcast.notes && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {podcast.notes}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                浏览于 {dayjs().format('YYYY-MM-DD HH:mm')}
              </Typography>
            </Box>
            <IconButton onClick={openPodcastEdit} aria-label="编辑播客">
              <EditIcon />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          单集列表 ({podcast.episodes.length})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateEpisode}>
          新增单集
        </Button>
      </Stack>

      <Card variant="outlined">
        {podcast.episodes.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">暂无单集，点击上方按钮添加。</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {podcast.episodes.map((episode, index) => (
              <Box key={episode.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <Stack direction="row">
                      <IconButton
                        edge="end"
                        color={episode.listened ? 'success' : 'default'}
                        onClick={() => handleToggleListen(episode.id)}
                        title={episode.listened ? '标记为未收听' : '标记为已收听'}
                      >
                        {episode.listened ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                      </IconButton>
                      <IconButton edge="end" onClick={() => openEditEpisode(episode)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleDeleteEpisode(episode)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ pr: 12 }}>
                    <Chip
                      label={episode.listened ? '已收听' : '未收听'}
                      color={episode.listened ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                    <ListItemText
                      primary={episode.title}
                      secondary={episode.recommendation || '暂无推荐语'}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </Stack>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Card>

      <Dialog
        open={podcastDialogOpen}
        onClose={() => setPodcastDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>编辑播客</DialogTitle>
        <DialogContent>
          {podcastForm && (
            <Stack spacing={2} mt={1}>
              <TextField
                label="名称"
                required
                fullWidth
                value={podcastForm.name}
                onChange={(e) => setPodcastForm({ ...podcastForm, name: e.target.value })}
              />
              <TextField
                label="平台"
                required
                fullWidth
                value={podcastForm.platform}
                onChange={(e) => setPodcastForm({ ...podcastForm, platform: e.target.value })}
              />
              <TextField
                label="主题"
                required
                fullWidth
                value={podcastForm.theme}
                onChange={(e) => setPodcastForm({ ...podcastForm, theme: e.target.value })}
              />
              <TextField
                label="评分 (0-10)"
                type="number"
                required
                fullWidth
                inputProps={{ min: 0, max: 10, step: 0.1 }}
                value={podcastForm.rating}
                onChange={(e) =>
                  setPodcastForm({ ...podcastForm, rating: Number(e.target.value) })
                }
              />
              <TextField
                label="备注"
                fullWidth
                multiline
                minRows={2}
                value={podcastForm.notes}
                onChange={(e) => setPodcastForm({ ...podcastForm, notes: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPodcastDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            disabled={!podcastForm || updatePodcastMutation.isPending}
            onClick={() => podcastForm && updatePodcastMutation.mutate(podcastForm)}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={episodeDialogOpen} onClose={closeEpisodeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingEpisode ? '编辑单集' : '新增单集'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="标题"
              required
              fullWidth
              value={episodeForm.title}
              onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
            />
            <TextField
              label="推荐语"
              fullWidth
              multiline
              minRows={2}
              value={episodeForm.recommendation}
              onChange={(e) =>
                setEpisodeForm({ ...episodeForm, recommendation: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEpisodeDialog}>取消</Button>
          <Button
            variant="contained"
            disabled={!episodeForm.title || saveEpisodeMutation.isPending}
            onClick={() => saveEpisodeMutation.mutate(episodeForm)}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
