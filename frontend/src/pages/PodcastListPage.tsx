import { useState } from 'react';
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
  IconButton,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import {
  createPodcast,
  deletePodcast,
  fetchPodcasts,
  updatePodcast,
} from '../api/podcasts';
import type { Podcast, PodcastFormData } from '../types';

const EMPTY_FORM: PodcastFormData = {
  name: '',
  platform: '',
  theme: '',
  rating: 8,
  notes: '',
};

/** 播客列表页 */
export default function PodcastListPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [form, setForm] = useState<PodcastFormData>(EMPTY_FORM);

  const { data: podcasts, isLoading, error } = useQuery({
    queryKey: ['podcasts'],
    queryFn: fetchPodcasts,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: PodcastFormData) =>
      editing ? updatePodcast(editing.id, payload) : createPodcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      closeDialog();
    },
  });

  const removeMutation = useMutation({
    mutationFn: deletePodcast,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['podcasts'] }),
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            播客列表
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dayjs().format('YYYY年M月D日')} · 共 {podcasts?.length ?? 0} 档节目
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          新增播客
        </Button>
      </Stack>

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
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>

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
