import { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchPodcastsByTheme } from '../api/podcasts';
import type { ThemeGroup } from '../types';

/** 主题浏览页 */
export default function ThemesPage() {
  const navigate = useNavigate();
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const { data: themeGroups, isLoading, error } = useQuery({
    queryKey: ['podcasts-by-theme'],
    queryFn: fetchPodcastsByTheme,
  });

  function handleThemeClick(theme: string) {
    setExpandedTheme(expandedTheme === theme ? null : theme);
  }

  function handlePodcastClick(id: number, event: React.MouseEvent) {
    event.stopPropagation();
    navigate(`/podcasts/${id}`);
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

  const totalThemes = themeGroups?.length ?? 0;
  const totalPodcasts = themeGroups?.reduce((sum, g) => sum + g.podcast_count, 0) ?? 0;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            主题分类浏览
          </Typography>
          <Typography variant="body2" color="text.secondary">
            共 {totalThemes} 个主题分类，{totalPodcasts} 档节目
          </Typography>
        </Box>
      </Stack>

      {themeGroups && themeGroups.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">
              暂无主题数据，先去播客列表添加一些节目吧。
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
          {themeGroups?.map((group: ThemeGroup) => (
            <Box key={group.theme}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => handleThemeClick(group.theme)}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CategoryIcon />
                        </Box>
                        <Chip
                          label={group.theme}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <ExpandMoreIcon
                        color="action"
                        sx={{
                          transform: expandedTheme === group.theme ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      播客数量
                    </Typography>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                      {group.podcast_count} 档
                    </Typography>
                    <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                      {expandedTheme === group.theme ? '点击收起列表' : '点击展开播客列表 →'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>

              {expandedTheme === group.theme && (
                <Accordion expanded defaultExpanded sx={{ mt: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ display: 'none' }}
                  >
                    <Typography>{group.theme}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <Stack spacing={1}>
                      {group.podcasts.map((podcast) => (
                        <Card
                          key={podcast.id}
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'action.hover',
                            },
                          }}
                          onClick={(e) => handlePodcastClick(podcast.id, e)}
                        >
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                  <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                                    {podcast.name}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color={podcast.is_favorited ? 'error' : 'default'}
                                    sx={{ p: 0.25 }}
                                  >
                                    {podcast.is_favorited ? (
                                      <FavoriteIcon sx={{ fontSize: 16 }} />
                                    ) : (
                                      <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                                    )}
                                  </IconButton>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                  <Chip
                                    label={podcast.platform}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: 11 } }}
                                  />
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Rating
                                      value={podcast.rating / 2}
                                      precision={0.5}
                                      readOnly
                                      size="small"
                                      sx={{ '& .MuiRating-icon': { fontSize: 14 } }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {podcast.rating.toFixed(1)}
                                    </Typography>
                                  </Stack>
                                </Stack>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
