import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, fetchAnalytics, fetchUsers } from '../features/adminSlice';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import { formatKES } from '../utils/currency';

// Admin dashboard with analytics charts and management summaries.
const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { analytics, users, orders } = useSelector((state) => state.admin);
  const [products, setProducts] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [productQuery, setProductQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productPage, setProductPage] = useState(1);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    brand: '',
    price: 0,
    countInStock: 0,
    images: '',
    featured: false,
  });

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchUsers());
    dispatch(fetchAllOrders());
    const loadProducts = async () => {
      const { data } = await api.get('/products', { params: { page: 1, limit: 100 } });
      setProducts(data.products);
    };
    loadProducts();
  }, [dispatch]);

  const approveSeller = async (userId) => {
    await api.put(`/admin/users/${userId}/approve-seller`);
    dispatch(fetchUsers());
  };

  const rejectSeller = async (userId) => {
    await api.put(`/admin/users/${userId}/reject-seller`);
    dispatch(fetchUsers());
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      images: form.images.split(',').map((img) => img.trim()).filter(Boolean),
      price: Number(form.price),
      countInStock: Number(form.countInStock),
      featured: Boolean(form.featured),
    };

    if (editingId) {
      await api.put(`/products/${editingId}`, payload);
    } else {
      await api.post('/products', payload);
    }

    const { data } = await api.get('/products', { params: { page: 1, limit: 100 } });
    setProducts(data.products);
    setEditingId('');
    setForm({
      name: '',
      slug: '',
      description: '',
      category: '',
      brand: '',
      price: 0,
      countInStock: 0,
      images: '',
      featured: false,
    });
  };

  const beginEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      brand: product.brand || '',
      price: product.price,
      countInStock: product.countInStock,
      images: (product.images || []).join(', '),
      featured: product.featured,
    });
  };

  const removeProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((item) => item._id !== id));
  };

  const chartData = analytics?.orderStatusBreakdown?.map((item) => ({
    status: item._id,
    count: item.count,
  })) || [];
  const productCategories = useMemo(
    () => ['all', ...new Set(products.map((item) => item.category).filter(Boolean))],
    [products]
  );
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatch =
        userRoleFilter === 'all'
        || (userRoleFilter === 'admin' && user.role === 'admin')
        || (userRoleFilter === 'buyer' && user.role !== 'admin' && !user.isSeller)
        || (userRoleFilter === 'seller_pending' && user.isSeller && !user.sellerApproved)
        || (userRoleFilter === 'seller_approved' && user.isSeller && user.sellerApproved);

      const queryMatch = !q || [user.name, user.email, user.role].join(' ').toLowerCase().includes(q);
      return roleMatch && queryMatch;
    });
  }, [users, userQuery, userRoleFilter]);
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = productCategoryFilter === 'all' || product.category === productCategoryFilter;
      const queryMatch = !q || [product.name, product.slug, product.category, product.brand].join(' ').toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [products, productQuery, productCategoryFilter]);
  const PRODUCTS_PER_PAGE = 10;
  const productPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const pagedProducts = filteredProducts.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );

  useEffect(() => {
    setProductPage(1);
  }, [productQuery, productCategoryFilter]);

  useEffect(() => {
    if (productPage > productPages) {
      setProductPage(productPages);
    }
  }, [productPage, productPages]);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Admin Dashboard</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Paper sx={{ p: 2 }}><Typography>Users: {analytics?.usersCount || 0}</Typography></Paper>
        <Paper sx={{ p: 2 }}><Typography>Products: {analytics?.productsCount || 0}</Typography></Paper>
        <Paper sx={{ p: 2 }}><Typography>Orders: {analytics?.ordersCount || 0}</Typography></Paper>
        <Paper sx={{ p: 2 }}><Typography>Revenue: {formatKES(analytics?.revenue || 0)}</Typography></Paper>
      </Box>

      <Paper sx={{ p: 2, height: 280 }}>
        <Typography sx={{ mb: 1 }}>Order Status Analytics</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>User Management</Typography>
        <Box sx={{ display: 'grid', gap: 1, mb: 1.5, gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' } }}>
          <TextField
            size="small"
            placeholder="Search by name/email/role..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Select size="small" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
            <MenuItem value="all">All users</MenuItem>
            <MenuItem value="admin">Admins</MenuItem>
            <MenuItem value="buyer">Buyers</MenuItem>
            <MenuItem value="seller_pending">Seller Pending</MenuItem>
            <MenuItem value="seller_approved">Seller Approved</MenuItem>
          </Select>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Showing {filteredUsers.length} of {users.length} users
        </Typography>

        <Box sx={{ display: 'grid', gap: 1 }}>
          {filteredUsers.map((user) => (
            <Paper
              key={user._id}
              elevation={0}
              sx={{ p: 1.2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                <Avatar sx={{ bgcolor: '#0d9488', width: 34, height: 34 }}>
                  {String(user.name || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.6, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip size="small" label={user.role} color={user.role === 'admin' ? 'secondary' : 'default'} />
                    <Chip
                      size="small"
                      label={!user.isSeller ? 'Buyer' : user.sellerApproved ? 'Seller Approved' : 'Seller Pending'}
                      color={!user.isSeller ? 'default' : user.sellerApproved ? 'success' : 'warning'}
                    />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {user.isSeller && !user.sellerApproved && (
                  <Button size="small" variant="contained" onClick={() => approveSeller(user._id)}>
                    Approve
                  </Button>
                )}
                {user.isSeller && (
                  <Button size="small" color="error" onClick={() => rejectSeller(user._id)}>
                    Reject
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
          {filteredUsers.length === 0 && (
            <Paper elevation={0} sx={{ p: 2, border: '1px dashed', borderColor: 'divider' }}>
              <Typography color="text.secondary">No users matched your filters.</Typography>
            </Paper>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Order Management</Typography>
        {orders.map((order) => (
          <Typography key={order._id}>#{order._id} - {order.user?.email} - {formatKES(order.totalPrice)} - {order.status}</Typography>
        ))}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Product CRUD
        </Typography>
        <Box sx={{ display: 'grid', gap: 1, mb: 1.5, gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' } }}>
          <TextField
            size="small"
            placeholder="Search products by name/slug/category/brand..."
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <Select size="small" value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)}>
            {productCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category === 'all' ? 'All categories' : category}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Showing {filteredProducts.length} of {products.length} products
        </Typography>
        <Divider sx={{ mb: 1.5 }} />

        <Box component="form" onSubmit={submitProduct} sx={{ display: 'grid', gap: 1, mb: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <TextField label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required />
          <TextField label="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required />
          <TextField label="Brand" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
          <TextField label="Price" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
          <TextField label="Stock" type="number" value={form.countInStock} onChange={(e) => setForm((p) => ({ ...p, countInStock: e.target.value }))} required />
          <TextField label="Image URLs (comma-separated)" value={form.images} onChange={(e) => setForm((p) => ({ ...p, images: e.target.value }))} sx={{ gridColumn: { xs: '1', md: 'span 3' } }} required />
          <TextField label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} sx={{ gridColumn: { xs: '1', md: 'span 3' } }} required />
          <Button type="submit" variant="contained">{editingId ? 'Update Product' : 'Create Product'}</Button>
          {editingId && <Button onClick={() => setEditingId('')}>Cancel Edit</Button>}
        </Box>

        {pagedProducts.map((product) => (
          <Box key={product._id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', py: 1 }}>
            <Typography>{product.name} ({formatKES(product.price)})</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => beginEdit(product)}>Edit</Button>
              <Button size="small" color="error" onClick={() => removeProduct(product._id)}>Delete</Button>
            </Box>
          </Box>
        ))}
        {filteredProducts.length > PRODUCTS_PER_PAGE && (
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              page={productPage}
              count={productPages}
              onChange={(_, page) => setProductPage(page)}
              color="primary"
            />
          </Box>
        )}
        {filteredProducts.length === 0 && (
          <Paper elevation={0} sx={{ p: 2, border: '1px dashed', borderColor: 'divider' }}>
            <Typography color="text.secondary">No products matched your filters.</Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default AdminDashboardPage;
