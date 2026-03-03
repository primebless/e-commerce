import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { formatKES } from '../utils/currency';

const JOBS = ['abandoned-cart-recovery', 'low-stock-alerts', 'weekly-kpi-digest'];

const AdminAutomationPage = () => {
  const [data, setData] = useState({ kpis: {}, queue: { registeredJobs: [] }, availableJobs: [] });
  const [loading, setLoading] = useState(false);
  const [runningJob, setRunningJob] = useState('');
  const [message, setMessage] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get('/admin/automation/summary');
      setData(response);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load automation summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runJob = async (jobName) => {
    setRunningJob(jobName);
    try {
      await api.post('/admin/automation/run', { jobName, mode: 'queue' });
      setMessage(`Queued ${jobName}`);
      await loadSummary();
    } catch (error) {
      setMessage(error.response?.data?.message || `Failed to queue ${jobName}`);
    } finally {
      setRunningJob('');
    }
  };

  const cards = useMemo(
    () => [
      { label: 'Revenue Today', value: formatKES(data.kpis.revenueToday || 0) },
      { label: 'Revenue 7d', value: formatKES(data.kpis.revenue7d || 0) },
      { label: 'Orders 7d', value: data.kpis.orders7d || 0 },
      { label: 'Avg Order 7d', value: formatKES(data.kpis.avgOrderValue7d || 0) },
      { label: 'New Users 7d', value: data.kpis.users7d || 0 },
      { label: 'Low Stock Count', value: data.kpis.lowStockCount || 0 },
      { label: 'Open Tickets', value: data.kpis.openTickets || 0 },
      { label: 'Abandoned Carts 24h+', value: data.kpis.abandonedCarts24h || 0 },
    ],
    [data]
  );

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4">Admin Automation</Typography>
        <Button variant="outlined" onClick={loadSummary} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {message && <Alert severity="info">{message}</Alert>}

      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}
      >
        {cards.map((card) => (
          <Paper key={card.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {card.label}
            </Typography>
            <Typography variant="h6">{card.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Queue Status
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Pending: ${data.queue.pending || 0}`} color="warning" />
          <Chip label={`Completed: ${data.queue.completed || 0}`} color="success" />
          <Chip label={`Failed: ${data.queue.failed || 0}`} color="error" />
          <Chip label={`Last Run: ${data.queue.lastRunAt || 'n/a'}`} />
        </Stack>
        {data.queue.lastError && (
          <Typography color="error" sx={{ mt: 1 }}>
            Last Error: {data.queue.lastError}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Manual Triggers
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Queue automation jobs on demand.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {(data.availableJobs?.length ? data.availableJobs : JOBS).map((jobName) => (
            <Button
              key={jobName}
              variant="contained"
              onClick={() => runJob(jobName)}
              disabled={runningJob === jobName}
            >
              {runningJob === jobName ? `Queueing ${jobName}...` : `Run ${jobName}`}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default AdminAutomationPage;
