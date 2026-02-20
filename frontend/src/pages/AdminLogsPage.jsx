import { Box, MenuItem, Pagination, Paper, Select, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';

// Admin-only page to inspect recorded user action logs.
const AdminLogsPage = () => {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const loadLogs = async () => {
      const { data } = await api.get('/admin/logs', {
        params: { action: action || undefined, page, limit: 20 },
      });
      setLogs(data.logs);
      setPages(data.pages);
    };

    loadLogs();
  }, [action, page]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Admin Logs</Typography>

      <Select
        size="small"
        value={action}
        onChange={(event) => {
          setAction(event.target.value);
          setPage(1);
        }}
        sx={{ mb: 2, minWidth: 200 }}
      >
        <MenuItem value="">All Actions</MenuItem>
        <MenuItem value="CREATE_ACCOUNT">CREATE_ACCOUNT</MenuItem>
        <MenuItem value="LOGIN">LOGIN</MenuItem>
        <MenuItem value="LOGOUT">LOGOUT</MenuItem>
        <MenuItem value="PURCHASE">PURCHASE</MenuItem>
      </Select>

      {logs.map((log) => (
        <Paper key={log.id} sx={{ p: 2, mb: 1.2 }}>
          <Typography variant="subtitle2">
            {log.action} | {new Date(log.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="body2">User: {log.user?.email || 'Unknown user'}</Typography>
          <Typography variant="body2">Details: {log.details || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            IP: {log.ipAddress || '-'} | Agent: {log.userAgent || '-'}
          </Typography>
        </Paper>
      ))}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination page={page} count={pages} onChange={(_, value) => setPage(value)} />
      </Box>
    </Box>
  );
};

export default AdminLogsPage;
