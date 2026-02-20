import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { toast } from '../utils/toast';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    minSubtotal: '',
    expiresAt: '',
    isActive: true,
  });

  const load = async () => {
    const { data } = await api.get('/admin/coupons');
    setCoupons(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      value: Number(form.value),
      minSubtotal: Number(form.minSubtotal || 0),
      isActive: form.isActive === true || form.isActive === 'true',
    };
    if (editingId) {
      await api.put(`/admin/coupons/${editingId}`, payload);
      toast.success('Coupon updated');
    } else {
      await api.post('/admin/coupons', payload);
      toast.success('Coupon created');
    }
    setEditingId('');
    setForm({ code: '', type: 'percent', value: '', minSubtotal: '', expiresAt: '', isActive: true });
    load();
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      type: row.type,
      value: String(row.value),
      minSubtotal: String(row.minSubtotal),
      expiresAt: row.expiresAt?.slice?.(0, 10) || '',
      isActive: row.isActive,
    });
  };

  const remove = async (id) => {
    await api.delete(`/admin/coupons/${id}`);
    toast.success('Coupon removed');
    load();
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Admin Coupons</Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{editingId ? 'Edit Coupon' : 'Create Coupon'}</Typography>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
          <TextField label="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} required />
          <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <MenuItem value="percent">Percent</MenuItem>
            <MenuItem value="fixed">Fixed</MenuItem>
          </Select>
          <TextField label="Value" type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} required />
          <TextField label="Min Subtotal" type="number" value={form.minSubtotal} onChange={(e) => setForm((p) => ({ ...p, minSubtotal: e.target.value }))} />
          <TextField label="Expires At" type="date" InputLabelProps={{ shrink: true }} value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} required />
          <Select value={String(form.isActive)} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value }))}>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
          <Button type="submit" variant="contained">{editingId ? 'Save' : 'Create'}</Button>
          {editingId && <Button onClick={() => setEditingId('')}>Cancel</Button>}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Coupons</Typography>
        {coupons.map((row) => (
          <Box key={row.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography>{row.code} | {row.type} {row.value} | Min KES {row.minSubtotal} | {row.isActive ? 'Active' : 'Inactive'}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => edit(row)}>Edit</Button>
              <Button size="small" color="error" onClick={() => remove(row.id)}>Delete</Button>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default AdminCouponsPage;
