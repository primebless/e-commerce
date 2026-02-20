import { Paper, Typography } from '@mui/material';

const PrivacyPage = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ mb: 2 }}>Privacy Policy</Typography>
    <Typography>We collect only the information required to process orders and support accounts.</Typography>
  </Paper>
);

export default PrivacyPage;
