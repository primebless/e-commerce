import { Button, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <Paper sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h4" sx={{ mb: 1 }}>404</Typography>
    <Typography sx={{ mb: 2 }}>Page not found.</Typography>
    <Button component={Link} to="/" variant="contained">Back Home</Button>
  </Paper>
);

export default NotFoundPage;
