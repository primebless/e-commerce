import { Paper, Typography } from '@mui/material';

const TermsPage = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 2 }}>Terms & Conditions</Typography>
    <Typography>Using this store means you agree to fair-use terms and applicable purchase policies.</Typography>
  </Paper>
);

export default TermsPage;
