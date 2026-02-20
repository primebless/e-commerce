import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProfile, updateProfile } from '../features/authSlice';
import { fetchMyOrders } from '../features/ordersSlice';
import { formatKES } from '../utils/currency';

// User profile page with profile update and order history.
const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myOrders } = useSelector((state) => state.orders);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchMyOrders());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, name: user.name || '', email: user.email || '' }));
    }
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    await dispatch(updateProfile(form));
  };

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Profile</Typography>
        <Box component="form" onSubmit={saveProfile}>
          <TextField fullWidth label="Name" sx={{ mb: 1 }} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <TextField fullWidth label="Email" sx={{ mb: 1 }} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <TextField fullWidth label="New Password" type="password" sx={{ mb: 1 }} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          <Button type="submit" variant="contained">Update Profile</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Order History</Typography>
        {myOrders.map((order) => (
          <Box key={order._id} sx={{ mb: 1.2, pb: 1.2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography>#{order._id} - {formatKES(order.totalPrice)} - {order.status}</Typography>
            <Button size="small" component={Link} to={`/order-confirmation/${order._id}`} sx={{ mt: 0.3, px: 0 }}>
              Track Order
            </Button>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default ProfilePage;
