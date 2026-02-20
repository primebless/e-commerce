import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { openLoginModal } from '../features/authSlice';
import { toast } from '../utils/toast';

// Restricts pages to admin users.
const AdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.token) {
      dispatch(openLoginModal());
      toast.error('Login required');
    }
  }, [user, dispatch]);

  if (!user?.token) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
