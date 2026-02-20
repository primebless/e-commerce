import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { closeLoginModal } from '../features/authSlice';

// Displays when an unauthenticated user tries to access a restricted page.
const LoginRequiredModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((state) => state.auth.showLoginModal);

  return (
    <Dialog open={open} onClose={() => dispatch(closeLoginModal())}>
      <DialogTitle>Login Required</DialogTitle>
      <DialogContent>
        <Typography>Please login or create an account to access this feature.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(closeLoginModal())}>Close</Button>
        <Button
          variant="contained"
          onClick={() => {
            dispatch(closeLoginModal());
            navigate('/login');
          }}
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginRequiredModal;
