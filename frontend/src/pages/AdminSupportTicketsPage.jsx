import { Box, MenuItem, Paper, Select, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { toast } from '../utils/toast';

const AdminSupportTicketsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [tickets, setTickets] = useState([]);

  const load = async (status = statusFilter) => {
    const { data } = await api.get('/admin/support-tickets', { params: { status: status || undefined } });
    setTickets(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/support-tickets/${id}`, { status });
    toast.success('Ticket updated');
    load();
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Admin Support Tickets</Typography>

      <Select
        size="small"
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          load(e.target.value);
        }}
        sx={{ maxWidth: 240 }}
      >
        <MenuItem value="">All Status</MenuItem>
        <MenuItem value="open">open</MenuItem>
        <MenuItem value="in_progress">in_progress</MenuItem>
        <MenuItem value="resolved">resolved</MenuItem>
        <MenuItem value="closed">closed</MenuItem>
      </Select>

      {tickets.map((ticket) => (
        <Paper key={ticket.id} sx={{ p: 2 }}>
          <Typography variant="subtitle2">{ticket.subject}</Typography>
          <Typography variant="body2">From: {ticket.name} ({ticket.email})</Typography>
          <Typography variant="body2">Order: {ticket.orderId || '-'}</Typography>
          <Typography variant="body2" sx={{ my: 1 }}>{ticket.message}</Typography>
          <Select
            size="small"
            value={ticket.status}
            onChange={(e) => updateStatus(ticket.id, e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="open">open</MenuItem>
            <MenuItem value="in_progress">in_progress</MenuItem>
            <MenuItem value="resolved">resolved</MenuItem>
            <MenuItem value="closed">closed</MenuItem>
          </Select>
        </Paper>
      ))}
    </Box>
  );
};

export default AdminSupportTicketsPage;
