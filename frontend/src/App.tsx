import { Container, AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import PodcastListPage from './pages/PodcastListPage';
import PodcastDetailPage from './pages/PodcastDetailPage';
import StatisticsPage from './pages/StatisticsPage';

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
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}
