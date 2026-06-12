import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import PodcastsIcon from '@mui/icons-material/Podcasts';
import { Routes, Route, Link } from 'react-router-dom';
import PodcastListPage from './pages/PodcastListPage';
import PodcastDetailPage from './pages/PodcastDetailPage';

/** 应用根组件：布局 + 路由 */
export default function App() {
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
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<PodcastListPage />} />
            <Route path="/podcasts/:id" element={<PodcastDetailPage />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}
