import { Paper, Typography } from '@mui/material';

const RefundPage = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 2 }}>Refund Policy</Typography>
    <Typography>Eligible returns are accepted within 14 days in original condition.</Typography>
  </Paper>
);

export default RefundPage;
