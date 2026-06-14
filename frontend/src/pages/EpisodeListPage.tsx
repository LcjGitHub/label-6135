import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TimerIcon from '@mui/icons-material/Timer';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllEpisodes, fetchRandomUnlistenedEpisode } from '../api/podcasts';
import type { EpisodeWithPodcast, RandomEpisodeRecommendation } from '../types';

type ListenStatusFilter = '全部' | '未收听' | '已收听';

/** 单集总览页 */
export default function EpisodeListPage() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RandomEpisodeRecommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [listenStatusFilter, setListenStatusFilter] = useState<ListenStatusFilter>('全部');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data: episodes, isLoading, error } = useQuery({
    queryKey: ['all-episodes', listenStatusFilter, searchKeyword],
    queryFn: () =>
      fetchAllEpisodes(
        listenStatusFilter === '全部' ? undefined : listenStatusFilter,
        searchKeyword || undefined,
      ),
  });

  function handleSearch() {
    setSearchKeyword(searchInput.trim());
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  function handleEpisodeClick(episode: EpisodeWithPodcast) {
    navigate(`/podcasts/${episode.podcast_id}`);
  }

  async function handleRandomRecommend() {
    setIsRecommending(true);
    try {
      const result = await fetchRandomUnlistenedEpisode();
      setRecommendation(result);
    } catch (err) {
      setRecommendation(null);
      setSnackbarMessage('暂无可推荐的未收听单集');
      setSnackbarOpen(true);
    } finally {
      setIsRecommending(false);
    }
  }

  function handleCloseRecommendation() {
    setRecommendation(null);
  }

  function handleSnackbarClose() {
    setSnackbarOpen(false);
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

  const filterOptions: ListenStatusFilter[] = ['全部', '未收听', '已收听'];

  function handleFilterChange(filter: ListenStatusFilter) {
    setListenStatusFilter(filter);
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            单集总览
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dayjs().format('YYYY年M月D日')} · 共 {episodes?.length ?? 0} 个单集
          </Typography>
        </Box>
        <Tooltip title="随机推荐未收听单集">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleRandomRecommend}
            disabled={isRecommending}
          >
            {isRecommending ? '推荐中...' : '随机推荐'}
          </Button>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap" useFlexGap>
        <ButtonGroup size="small" aria-label="收听状态筛选">
          {filterOptions.map((option) => (
            <Button
              key={option}
              variant={listenStatusFilter === option ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange(option)}
            >
              {option}
            </Button>
          ))}
        </ButtonGroup>
        <TextField
          size="small"
          label="标题搜索"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="输入关键词搜索单集标题..."
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
            },
          }}
        />
        <Button
          size="small"
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
        >
          搜索
        </Button>
      </Stack>

      {recommendation && (
        <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Stack spacing={1} sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AutoAwesomeIcon color="primary" />
                  <Typography variant="subtitle2" color="primary" fontWeight={600}>
                    为你推荐
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {recommendation.title}
                </Typography>
                <Chip
                  icon={<PodcastsIcon fontSize="small" />}
                  label={recommendation.podcast_name}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                />
                {recommendation.recommendation ? (
                  <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1 }}>
                    <FormatQuoteIcon fontSize="small" color="disabled" sx={{ mt: 0.3 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {recommendation.recommendation}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    暂无推荐语
                  </Typography>
                )}
              </Stack>
              <IconButton size="small" onClick={handleCloseRecommendation} sx={{ flexShrink: 0 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 2, pr: 2 }}>
            <Button
              size="small"
              color="primary"
              onClick={() => navigate(`/podcasts/${recommendation.podcast_id}`)}
            >
              前往播客详情
            </Button>
          </CardActions>
        </Card>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />

      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {episodes?.map((episode) => (
          <ListItem
            key={episode.id}
            disablePadding
            divider
            secondaryAction={
              <Chip
                icon={<PodcastsIcon fontSize="small" />}
                label={`#${episode.podcast_id} ${episode.podcast_name}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            }
          >
            <ListItemButton onClick={() => handleEpisodeClick(episode)}>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {episode.title}
                    </Typography>
                    {episode.duration != null && (
                      <Chip
                        icon={<TimerIcon fontSize="small" />}
                        label={`${episode.duration} 分钟`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                }
                secondary={
                  episode.recommendation ? (
                    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 0.5 }}>
                      <FormatQuoteIcon fontSize="small" color="disabled" sx={{ mt: 0.3 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {episode.recommendation}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      暂无推荐语
                    </Typography>
                  )
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {episodes?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="body1" color="text.secondary">
            暂无单集数据
          </Typography>
        </Box>
      )}
    </>
  );
}
