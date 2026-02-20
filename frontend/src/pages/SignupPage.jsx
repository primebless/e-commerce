import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../features/authSlice';

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submitHandler = async (event) => {
    event.preventDefault();
    const action = await dispatch(signup(form));
    if (action.meta.requestStatus === 'fulfilled') navigate('/');
  };

  return (
    <Paper sx={{ maxWidth: 480, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Create Account</Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box component="form" onSubmit={submitHandler}>
        <TextField fullWidth label="Name" sx={{ mb: 1 }} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <TextField fullWidth label="Email" sx={{ mb: 1 }} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <TextField fullWidth label="Password" type="password" sx={{ mb: 1 }} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
        <Button fullWidth type="submit" variant="contained" disabled={loading}>Sign Up</Button>
      </Box>
      <Typography sx={{ mt: 1 }}>Already have an account? <Link to="/login">Login</Link></Typography>
    </Paper>
  );
};

export default SignupPage;
