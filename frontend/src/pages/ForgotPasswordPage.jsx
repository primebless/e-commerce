import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../features/authSlice';

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { infoMessage } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');

  const submitHandler = async (event) => {
    event.preventDefault();
    await dispatch(forgotPassword({ email }));
  };

  return (
    <Paper sx={{ maxWidth: 480, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Forgot Password</Typography>
      <Box component="form" onSubmit={submitHandler}>
        <TextField fullWidth label="Email" sx={{ mb: 1 }} value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button fullWidth type="submit" variant="contained">Send Reset Link</Button>
      </Box>
      {infoMessage && <Alert sx={{ mt: 2 }}>{infoMessage}</Alert>}
    </Paper>
  );
};

export default ForgotPasswordPage;
