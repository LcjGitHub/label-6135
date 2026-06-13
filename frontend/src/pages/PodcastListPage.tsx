import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Rating,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import {
  createPodcast,
  deletePodcast,
  fetchPlatforms,
  fetchPodcasts,
  toggleFavorite,
  updatePodcast,
  type RatingSort,
} from '../api/podcasts';
import type { Podcast, PodcastFormData } from '../types';

const EMPTY_FORM: PodcastFormData = {
  name: '',
  platform: '',
  theme: '',
  rating: 8,
  notes: '',
  subscribe_url: '',
};

/** 播客列表页 */
export default function PodcastListPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [form, setForm] = useState<PodcastFormData>(EMPTY_FORM);
  const [favoritedOnly, setFavoritedOnly] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [ratingSort, setRatingSort] = useState<RatingSort>('none');

  const { data: platforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: fetchPlatforms,
  });

  const { data: podcasts, isFetching, isLoading, error } = useQuery({
    queryKey: ['podcasts', favoritedOnly, selectedPlatform, searchKeyword, ratingSort],
    queryFn: () => fetchPodcasts(favoritedOnly, selectedPlatform, searchKeyword, ratingSort),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: PodcastFormData) =>
      editing ? updatePodcast(editing.id, payload) : createPodcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
      closeDialog();
    },
  });

  const removeMutation = useMutation({
    mutationFn: deletePodcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-episodes'] });
    },
  });

  /** 打开新建对话框 */
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  /**
   * 打开编辑对话框
   * @param podcast - 待编辑播客
   */
  function openEdit(podcast: Podcast, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setEditing(podcast);
    setForm({
      name: podcast.name,
      platform: podcast.platform,
      theme: podcast.theme,
      rating: podcast.rating,
      notes: podcast.notes ?? '',
      subscribe_url: podcast.subscribe_url ?? '',
    });
    setDialogOpen(true);
  }

  /** 关闭对话框 */
  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  /** 提交表单 */
  function handleSubmit() {
    saveMutation.mutate(form);
  }

  /**
   * 删除播客
   * @param podcast - 待删除播客
   */
  function handleDelete(podcast: Podcast, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (window.confirm(`确定删除「${podcast.name}」？`)) {
      removeMutation.mutate(podcast.id);
    }
  }

  /**
   * 切换收藏状态
   * @param podcast - 播客
   */
  function handleToggleFavorite(podcast: Podcast, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    favoriteMutation.mutate(podcast.id);
  }

  /**
   * 切换筛选模式
   * @param _ - 事件对象
   * @param newValue - 新值
   */
  function handleFilterChange(
    _: React.MouseEvent<HTMLElement>,
    newValue: 'all' | 'favorited',
  ) {
    if (newValue !== null) {
      setFavoritedOnly(newValue === 'favorited');
    }
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            播客列表
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dayjs().format('YYYY年M月D日')} · 共 {podcasts?.length ?? 0} 档节目
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={favoritedOnly ? 'favorited' : 'all'}
            exclusive
            onChange={handleFilterChange}
            size="small"
          >
            <ToggleButton value="all">查看全部</ToggleButton>
            <ToggleButton value="favorited">
              <FavoriteIcon sx={{ fontSize: 18, mr: 0.5 }} />
              只看收藏
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            新增播客
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="platform-filter-label">平台筛选</InputLabel>
          <Select
            labelId="platform-filter-label"
            value={selectedPlatform}
            label="平台筛选"
            onChange={(e) => setSelectedPlatform(e.target.value)}
          >
            <MenuItem value="">全部平台</MenuItem>
            {platforms.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="rating-sort-label">评分排序</InputLabel>
          <Select
            labelId="rating-sort-label"
            value={ratingSort}
            label="评分排序"
            onChange={(e) => setRatingSort(e.target.value as RatingSort)}
          >
            <MenuItem value="none">按编号排序</MenuItem>
            <MenuItem value="desc">评分从高到低</MenuItem>
            <MenuItem value="asc">评分从低到高</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="名称搜索"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="输入关键词模糊搜索..."
          sx={{ minWidth: 260, flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
            },
          }}
        />
      </Stack>

      {isLoading || isFetching ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          加载失败，请确认后端已在 7000 端口启动。
        </Alert>
      ) : podcasts && podcasts.length === 0 ? (
        <Box
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            暂无符合条件的播客
          </Typography>
        </Box>
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
          {podcasts?.map((podcast) => (
            <Box key={podcast.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea
                  component={RouterLink}
                  to={`/podcasts/${podcast.id}`}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {podcast.name}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          color={podcast.is_favorited ? 'error' : 'default'}
                          onClick={(e) => handleToggleFavorite(podcast, e)}
                        >
                          {podcast.is_favorited ? (
                            <FavoriteIcon fontSize="small" />
                          ) : (
                            <FavoriteBorderIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton size="small" onClick={(e) => openEdit(podcast, e)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDelete(podcast, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap" useFlexGap>
                      <Chip label={podcast.platform} size="small" color="primary" variant="outlined" />
                      <Chip label={podcast.theme} size="small" />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Rating value={podcast.rating / 2} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        {podcast.rating.toFixed(1)}
                      </Typography>
                    </Stack>
                    {podcast.notes && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {podcast.notes}
                      </Typography>
                    )}
                    {podcast.subscribe_url && (
                      <Link
                        href={podcast.subscribe_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        component="a"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ mt: 1, display: 'inline-block' }}
                      >
                        订阅链接 →
                      </Link>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? '编辑播客' : '新增播客'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="名称"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="平台"
              required
              fullWidth
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            />
            <TextField
              label="主题"
              required
              fullWidth
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
            />
            <TextField
              label="评分 (0-10)"
              type="number"
              required
              fullWidth
              inputProps={{ min: 0, max: 10, step: 0.1 }}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            />
            <TextField
              label="备注"
              fullWidth
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <TextField
              label="订阅链接"
              fullWidth
              placeholder="输入播客订阅地址 URL"
              value={form.subscribe_url}
              onChange={(e) => setForm({ ...form, subscribe_url: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.name || !form.platform || !form.theme || saveMutation.isPending}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
