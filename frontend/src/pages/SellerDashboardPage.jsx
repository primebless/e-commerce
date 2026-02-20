import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/client';
import { fetchProfile } from '../features/authSlice';
import { toast } from '../utils/toast';
import { formatKES } from '../utils/currency';

const SellerDashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    price: '',
    countInStock: '',
    images: '',
    featured: false,
  });

  const load = async () => {
    try {
      const [overviewRes, productsRes] = await Promise.all([
        api.get('/seller/overview'),
        api.get('/seller/products'),
      ]);
      setOverview(overviewRes.data);
      setProducts(productsRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Seller dashboard load failed');
    }
  };

  useEffect(() => {
    if (!user?.isSeller || !user?.sellerApproved) return;
    load();
  }, [user?.isSeller, user?.sellerApproved]);

  const requestSellerAccess = async () => {
    setRequestingAccess(true);
    try {
      const { data } = await api.post('/seller/request-access');
      toast.success(data?.message || 'Seller request submitted');
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request seller access');
    } finally {
      setRequestingAccess(false);
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    try {
      await api.post('/seller/products', {
        ...form,
        images: form.images.split(',').map((x) => x.trim()).filter(Boolean),
        price: Number(form.price),
        countInStock: Number(form.countInStock),
      });
      setForm({ name: '', slug: '', description: '', category: '', price: '', countInStock: '', images: '', featured: false });
      toast.success('Product created');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Seller Dashboard (Foundation)</Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Business Deal</Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          For every product sale, the platform keeps a 10% commission and you receive 90%.
        </Typography>
        <Typography variant="body2">
          Example: If a customer buys your product for KES 100, platform commission is KES 10 and your payout is KES 90.
        </Typography>
      </Paper>

      {!user?.isSeller && (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ mb: 1 }}>
            To sell products, request a seller account first. Admin approval is required.
          </Typography>
          <Button variant="contained" onClick={requestSellerAccess} disabled={requestingAccess}>
            {requestingAccess ? 'Submitting...' : 'Request Seller Account'}
          </Button>
        </Paper>
      )}

      {user?.isSeller && !user?.sellerApproved && (
        <Paper sx={{ p: 2 }}>
          <Typography>
            Seller request submitted. You can add products after admin approval.
          </Typography>
        </Paper>
      )}

      {user?.isSeller && user?.sellerApproved && (
        <>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
            <Paper sx={{ p: 2 }}><Typography>Products: {overview?.productsCount ?? 0}</Typography></Paper>
            <Paper sx={{ p: 2 }}><Typography>Orders With Your Items: {overview?.ordersCount ?? 0}</Typography></Paper>
            <Paper sx={{ p: 2 }}><Typography>Units Sold: {overview?.unitsSold ?? 0}</Typography></Paper>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
            <Paper sx={{ p: 2 }}><Typography>Gross Sales: {formatKES(overview?.grossSales ?? 0)}</Typography></Paper>
            <Paper sx={{ p: 2 }}><Typography>Platform Commission (10%): {formatKES(overview?.platformCommission ?? 0)}</Typography></Paper>
            <Paper sx={{ p: 2 }}><Typography>Your Payout (90%): {formatKES(overview?.sellerPayout ?? 0)}</Typography></Paper>
          </Box>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Create Product</Typography>
            <Box component="form" onSubmit={createProduct}>
              <TextField fullWidth sx={{ mb: 1 }} label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <TextField fullWidth sx={{ mb: 1 }} label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              <TextField fullWidth sx={{ mb: 1 }} label="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              <TextField fullWidth sx={{ mb: 1 }} label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              <TextField fullWidth sx={{ mb: 1 }} label="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              <TextField fullWidth sx={{ mb: 1 }} label="Stock" value={form.countInStock} onChange={(e) => setForm((p) => ({ ...p, countInStock: e.target.value }))} />
              <TextField fullWidth sx={{ mb: 1 }} label="Images (comma separated URLs)" value={form.images} onChange={(e) => setForm((p) => ({ ...p, images: e.target.value }))} />
              <Button type="submit" variant="contained">Add Product</Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>My Products</Typography>
            {products.map((item) => (
              <Typography key={item._id}>{item.name} - {formatKES(item.price)} - Stock: {item.countInStock}</Typography>
            ))}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default SellerDashboardPage;
