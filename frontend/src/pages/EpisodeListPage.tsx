import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchAllEpisodes } from '../api/podcasts';
import type { EpisodeWithPodcast } from '../types';

/** 单集总览页 */
export default function EpisodeListPage() {
  const navigate = useNavigate();

  const { data: episodes, isLoading, error } = useQuery({
    queryKey: ['all-episodes'],
    queryFn: fetchAllEpisodes,
  });

  function handleEpisodeClick(episode: EpisodeWithPodcast) {
    navigate(`/podcasts/${episode.podcast_id}`);
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
            单集总览
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dayjs().format('YYYY年M月D日')} · 共 {episodes?.length ?? 0} 个单集
          </Typography>
        </Box>
      </Stack>

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
                sx={{ mr: 1 }}
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
                  ) : null
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
