import { useEffect, useState } from 'react';
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
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemText,
  Rating,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  createEpisode,
  deleteEpisode,
  fetchEpisodes,
  fetchPodcast,
  updateAllEpisodesListenStatus,
  updateEpisode,
  updateListenStatus,
  updatePodcast,
} from '../api/podcasts';
import type { Episode, EpisodeFormData, ListenStatus, PodcastFormData } from '../types';

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
  const [updatingEpisodeId, setUpdatingEpisodeId] = useState<number | null>(null);
  const [errorSnackbar, setErrorSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });
  const [successSnackbar, setSuccessSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });
  const [markAllDialogOpen, setMarkAllDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data: podcast, isLoading, error } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: () => fetchPodcast(podcastId),
    enabled: Number.isFinite(podcastId),
  });

  const { data: searchedEpisodes, isFetching: isSearching } = useQuery({
    queryKey: ['episodes', podcastId, searchKeyword],
    queryFn: () => fetchEpisodes(podcastId, searchKeyword || undefined),
    enabled: Number.isFinite(podcastId) && searchKeyword.length > 0,
    placeholderData: undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const showSearchResults = searchKeyword.length > 0;
  const isSearchFirstLoading = showSearchResults && isSearching && !searchedEpisodes;
  const episodes: Episode[] = showSearchResults
    ? searchedEpisodes ?? []
    : podcast?.episodes ?? [];

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
      queryClient.invalidateQueries({ queryKey: ['episodes', podcastId] });
      closeEpisodeDialog();
    },
  });

  const removeEpisodeMutation = useMutation({
    mutationFn: deleteEpisode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episodes', podcastId] });
    },
  });

  const toggleListenMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ListenStatus }) =>
      updateListenStatus(id, status),
    onMutate: ({ id }) => {
      setUpdatingEpisodeId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episodes', podcastId] });
    },
    onError: (error) => {
      setErrorSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '更新收听状态失败，请重试',
      });
    },
    onSettled: () => {
      setUpdatingEpisodeId(null);
    },
  });

  const markAllListenedMutation = useMutation({
    mutationFn: () => updateAllEpisodesListenStatus(podcastId, '已收听'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episodes', podcastId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setMarkAllDialogOpen(false);
      setSuccessSnackbar({
        open: true,
        message: `已成功将 ${data.updated_count} 个单集标记为已收听`,
      });
    },
    onError: (error) => {
      setErrorSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : '批量标记已收听失败，请重试',
      });
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
      subscribe_url: podcast.subscribe_url ?? '',
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
   * @param episode - 单集对象
   */
  function handleToggleListen(episode: Episode) {
    const targetStatus: ListenStatus =
      episode.listen_status === '未收听' ? '已收听' : '未收听';
    toggleListenMutation.mutate({ id: episode.id, status: targetStatus });
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
              {podcast.subscribe_url && (
                <Box>
                  <Link
                    href={podcast.subscribe_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body1"
                    component="a"
                    sx={{ mb: 1, display: 'inline-block' }}
                  >
                    🔗 访问订阅链接
                  </Link>
                </Box>
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
          单集列表 (
          {showSearchResults
            ? isSearchFirstLoading
              ? `搜索中... / ${podcast.episodes.length}`
              : `${episodes.length} / ${podcast.episodes.length}`
            : podcast.episodes.length}
          )
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            onClick={() => setMarkAllDialogOpen(true)}
            disabled={podcast.episodes.length === 0 || markAllListenedMutation.isPending}
          >
            {markAllListenedMutation.isPending ? '标记中...' : '全部标记已收听'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateEpisode}>
            新增单集
          </Button>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        placeholder="搜索单集标题关键词..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                {isSearching ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchIcon fontSize="small" color="action" />
                )}
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => {
                    setSearchInput('');
                    setSearchKeyword('');
                  }}
                  aria-label="清除搜索"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <Card variant="outlined">
        {isSearchFirstLoading ? (
          <Box p={4} textAlign="center">
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography color="text.secondary">正在搜索单集...</Typography>
          </Box>
        ) : episodes.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              {showSearchResults
                ? `没有找到标题包含「${searchKeyword}」的单集。`
                : '暂无单集，点击上方按钮添加。'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {episodes.map((episode, index) => (
              <Box key={episode.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <Stack direction="row">
                      <IconButton
                        edge="end"
                        color={episode.listen_status === '已收听' ? 'success' : 'default'}
                        onClick={() => handleToggleListen(episode)}
                        title={
                          episode.listen_status === '已收听' ? '标记为未收听' : '标记为已收听'
                        }
                        disabled={updatingEpisodeId === episode.id}
                      >
                        {episode.listen_status === '已收听' ? (
                          <CheckCircleIcon />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )}
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
                      label={episode.listen_status}
                      color={episode.listen_status === '已收听' ? 'success' : 'default'}
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
              <TextField
                label="订阅链接"
                fullWidth
                placeholder="请输入该播客的订阅或收听地址"
                value={podcastForm.subscribe_url}
                onChange={(e) => setPodcastForm({ ...podcastForm, subscribe_url: e.target.value })}
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

      <Dialog
        open={markAllDialogOpen}
        onClose={() => !markAllListenedMutation.isPending && setMarkAllDialogOpen(false)}
      >
        <DialogTitle>确认全部标记已收听</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要将该播客下全部 {podcast?.episodes.length ?? 0} 个单集标记为已收听吗？
            此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMarkAllDialogOpen(false)}
            disabled={markAllListenedMutation.isPending}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => markAllListenedMutation.mutate()}
            disabled={markAllListenedMutation.isPending}
          >
            {markAllListenedMutation.isPending ? '标记中...' : '确认标记'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setSuccessSnackbar({ ...successSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccessSnackbar({ ...successSnackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {successSnackbar.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setErrorSnackbar({ ...errorSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => setErrorSnackbar({ ...errorSnackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {errorSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
