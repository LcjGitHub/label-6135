import { Container, AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListIcon from '@mui/icons-material/List';
import CategoryIcon from '@mui/icons-material/Category';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import PodcastListPage from './pages/PodcastListPage';
import PodcastDetailPage from './pages/PodcastDetailPage';
import StatisticsPage from './pages/StatisticsPage';
import EpisodeListPage from './pages/EpisodeListPage';
import ThemesPage from './pages/ThemesPage';

/** 应用根组件：布局 + 路由 */
export default function App() {
  const location = useLocation();

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <PodcastsIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
          >
            小众播客节目单
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component={Link}
            to="/"
            color="inherit"
            sx={{
              fontWeight: location.pathname === '/' ? 700 : 400,
              opacity: location.pathname === '/' ? 1 : 0.8,
            }}
          >
            播客列表
          </Button>
          <Button
            component={Link}
            to="/episodes"
            color="inherit"
            startIcon={<ListIcon />}
            sx={{
              fontWeight: location.pathname === '/episodes' ? 700 : 400,
              opacity: location.pathname === '/episodes' ? 1 : 0.8,
            }}
          >
            单集总览
          </Button>
          <Button
            component={Link}
            to="/themes"
            color="inherit"
            startIcon={<CategoryIcon />}
            sx={{
              fontWeight: location.pathname === '/themes' ? 700 : 400,
              opacity: location.pathname === '/themes' ? 1 : 0.8,
            }}
          >
            主题浏览
          </Button>
          <Button
            component={Link}
            to="/statistics"
            color="inherit"
            startIcon={<BarChartIcon />}
            sx={{
              fontWeight: location.pathname === '/statistics' ? 700 : 400,
              opacity: location.pathname === '/statistics' ? 1 : 0.8,
            }}
          >
            数据统计
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<PodcastListPage />} />
            <Route path="/podcasts/:id" element={<PodcastDetailPage />} />
            <Route path="/episodes" element={<EpisodeListPage />} />
            <Route path="/themes" element={<ThemesPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}
