import { useRef, useState } from 'react';
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
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Rating,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import CategoryIcon from '@mui/icons-material/Category';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { exportAllData, fetchStats, importData } from '../api/podcasts';
import type { ImportMode, PlatformStats, ThemeStats } from '../types';

/** 统计概览页 */
export default function StatisticsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const exportMutation = useMutation({
    mutationFn: exportAllData,
    onSuccess: () => {
      setSnackbar({ open: true, message: '数据导出成功', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: `导出失败：${err?.response?.data?.detail || err.message}`,
        severity: 'error',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: ({ file, mode }: { file: File; mode: ImportMode }) =>
      importData(file, mode),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: `${data.message}（播客：${data.imported_podcasts} 档，单集：${data.imported_episodes} 条，笔记：${data.imported_notes} 条）`,
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      setConfirmDialogOpen(false);
      setSelectedFile(null);
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: `导入失败：${err?.response?.data?.detail || err.message}`,
        severity: 'error',
      });
      setConfirmDialogOpen(false);
    },
  });

  function handlePlatformClick(platform: string) {
    navigate(`/?platform=${encodeURIComponent(platform)}`);
  }

  function handleThemeClick(theme: string) {
    navigate(`/?theme=${encodeURIComponent(theme)}`);
  }

  function handleExportClick() {
    exportMutation.mutate();
  }

  function handleImportButtonClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setSnackbar({
          open: true,
          message: '请选择 JSON 格式文件',
          severity: 'error',
        });
        return;
      }
      setSelectedFile(file);
      setConfirmDialogOpen(true);
      setImportMode('append');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleConfirmImport() {
    if (selectedFile) {
      importMutation.mutate({ file: selectedFile, mode: importMode });
    }
  }

  function handleSnackbarClose() {
    setSnackbar((prev) => ({ ...prev, open: false }));
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
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

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'success.light',
                color: 'success.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HeadphonesIcon fontSize="large" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                收听完成度
              </Typography>
              <Stack direction="row" spacing={2} alignItems="baseline">
                <Typography variant="h4" fontWeight={700}>
                  {stats?.listen_completion_percent ?? 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已收听 {stats?.listened_episodes ?? 0} 集 / 未收听 {stats?.unlistened_episodes ?? 0} 集
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={stats?.listen_completion_percent ?? 0}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

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
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Rating value={item.avg_rating / 2} precision={0.5} readOnly size="small" />
                    <Typography variant="body1" fontWeight={600}>
                      {item.avg_rating.toFixed(1)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    点击查看该平台播客 →
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Typography variant="h5" fontWeight={600} gutterBottom mb={2} mt={4}>
        各主题分布
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'info.light',
                color: 'info.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CategoryIcon />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                共 {stats?.theme_stats?.length ?? 0} 个主题分类
              </Typography>
            </Box>
          </Stack>
          {stats?.theme_stats?.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                暂无主题数据，先去播客列表添加一些节目吧。
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
              }}
            >
              {stats?.theme_stats?.map((item: ThemeStats) => (
                <Card
                  key={item.theme}
                  variant="outlined"
                  sx={{
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <CardActionArea
                    onClick={() => handleThemeClick(item.theme)}
                    sx={{ py: 1.5, px: 2 }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip
                          label={item.theme}
                          color="info"
                          variant="outlined"
                          size="small"
                        />
                        <Typography variant="body1" fontWeight={600}>
                          {item.podcast_count} 档
                        </Typography>
                      </Stack>
                      <ChevronRightIcon
                        fontSize="small"
                        sx={{ color: 'text.secondary' }}
                      />
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 6 }} />

      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        <Button
          variant="outlined"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={handleExportClick}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? '导出中...' : '导出全部数据'}
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={<UploadIcon />}
          onClick={handleImportButtonClick}
          disabled={importMutation.isPending}
        >
          {importMutation.isPending ? '导入中...' : '选择文件导入'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Stack>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => !importMutation.isPending && setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>确认导入数据</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            您选择的文件：<strong>{selectedFile?.name}</strong>
          </DialogContentText>
          <DialogContentText sx={{ mb: 2, color: 'warning.main' }}>
            请选择导入模式：
          </DialogContentText>
          <FormControl component="fieldset">
            <RadioGroup
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as ImportMode)}
            >
              <FormControlLabel
                value="append"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      追加模式
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      保留现有数据，将文件中的播客数据追加到数据库中
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="overwrite"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600} color="error.main">
                      覆盖模式
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      删除所有现有数据，使用文件中的数据完全替换
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={importMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            color={importMode === 'overwrite' ? 'error' : 'primary'}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? '导入中...' : '确认导入'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
