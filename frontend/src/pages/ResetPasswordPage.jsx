import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { resetPassword } from '../features/authSlice';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { infoMessage } = useSelector((state) => state.auth);
  const [password, setPassword] = useState('');

  const submitHandler = async (event) => {
    event.preventDefault();
    await dispatch(resetPassword({ token, password }));
  };

  return (
    <Paper sx={{ maxWidth: 480, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Reset Password</Typography>
      <Box component="form" onSubmit={submitHandler}>
        <TextField fullWidth type="password" label="New Password" sx={{ mb: 1 }} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button fullWidth type="submit" variant="contained">Reset Password</Button>
      </Box>
      {infoMessage && <Alert sx={{ mt: 2 }}>{infoMessage}</Alert>}
    </Paper>
  );
};

export default ResetPasswordPage;
