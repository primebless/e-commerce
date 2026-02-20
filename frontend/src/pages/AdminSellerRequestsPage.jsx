import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { toast } from '../utils/toast';

const AdminSellerRequestsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load seller dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveSeller = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/approve-seller`);
      toast.success('Seller approved');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const rejectSeller = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/reject-seller`);
      toast.success('Seller request rejected');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const pendingRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!(user.isSeller && !user.sellerApproved)) return false;
      return !q || [user.name, user.email].join(' ').toLowerCase().includes(q);
    });
  }, [users, query]);

  const approvedSellers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!(user.isSeller && user.sellerApproved)) return false;
      return !q || [user.name, user.email].join(' ').toLowerCase().includes(q);
    });
  }, [users, query]);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Seller Dashboard</Typography>

      <Paper sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search sellers by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
      </Paper>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
        <Paper sx={{ p: 2 }}><Typography>Pending Requests: {pendingRequests.length}</Typography></Paper>
        <Paper sx={{ p: 2 }}><Typography>Approved Sellers: {approvedSellers.length}</Typography></Paper>
        <Paper sx={{ p: 2 }}><Typography>Total Seller Accounts: {pendingRequests.length + approvedSellers.length}</Typography></Paper>
      </Box>

      {loading && <Typography>Loading seller dashboard...</Typography>}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Pending Seller Requests</Typography>
        {!loading && pendingRequests.length === 0 && (
          <Typography color="text.secondary">No pending seller requests right now.</Typography>
        )}
        <Box sx={{ display: 'grid', gap: 1 }}>
          {!loading && pendingRequests.map((user) => (
            <Paper key={user._id} elevation={0} sx={{ p: 1.2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, minWidth: 0 }}>
                <Avatar sx={{ bgcolor: '#0d9488', width: 34, height: 34 }}>
                  {String(user.name || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  <Box sx={{ mt: 0.4 }}>
                    <Chip size="small" color="warning" label="Pending approval" />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color="text.secondary">
                    Requested: {user.sellerApprovalRequestedAt ? new Date(user.sellerApprovalRequestedAt).toLocaleString() : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Button size="small" variant="contained" onClick={() => approveSeller(user._id)}>
                  Approve
                </Button>
                <Button size="small" color="error" onClick={() => rejectSeller(user._id)}>
                  Reject
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Approved Sellers</Typography>
        {!loading && approvedSellers.length === 0 && (
          <Typography color="text.secondary">No approved sellers matched your search.</Typography>
        )}
        <Box sx={{ display: 'grid', gap: 1 }}>
          {!loading && approvedSellers.map((user) => (
            <Paper key={user._id} elevation={0} sx={{ p: 1.2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, minWidth: 0 }}>
                <Avatar sx={{ bgcolor: '#15803d', width: 34, height: 34 }}>
                  {String(user.name || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  <Box sx={{ mt: 0.4 }}>
                    <Chip size="small" color="success" label="Approved seller" />
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color="text.secondary">
                    Approved: {user.sellerApprovedAt ? new Date(user.sellerApprovedAt).toLocaleString() : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button size="small" color="error" onClick={() => rejectSeller(user._id)}>
                  Revoke
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Divider />
      <Typography variant="caption" color="text.secondary">
        Seller management is now fully consolidated on this page.
      </Typography>
    </Box>
  );
};

export default AdminSellerRequestsPage;
