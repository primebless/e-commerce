import { Box, Chip, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchOrderById } from '../features/ordersSlice';
import { formatKES } from '../utils/currency';

// Confirmation page after successful order placement.
const OrderConfirmationPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentOrder } = useSelector((state) => state.orders);

  useEffect(() => {
    if (user?.token) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id, user]);

  if (!currentOrder) return <Typography>Loading order...</Typography>;
  const steps = ['pending', 'paid', 'shipped', 'delivered'];
  const activeIndex = Math.max(0, steps.indexOf(String(currentOrder.status || '').toLowerCase()));
  const usedIntaSendMpesa = currentOrder?.paymentMethod === 'intasend'
    || currentOrder?.paymentResult?.channel === 'mpesa'
    || currentOrder?.paymentResult?.provider === 'intasend';

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Order Confirmed</Typography>
      <Typography sx={{ mb: 2 }}>Order ID: {currentOrder._id}</Typography>
      {usedIntaSendMpesa && (
        <Chip
          label="Paid securely via PRIME • IntaSend (M-Pesa STK)"
          color="info"
          sx={{ mb: 2, mr: 1 }}
        />
      )}
      <Chip label={currentOrder.status} color={currentOrder.isPaid ? 'success' : 'warning'} sx={{ mb: 2 }} />
      <Typography>Shipping to: {currentOrder.shippingAddress.address}, {currentOrder.shippingAddress.city}</Typography>
      <Typography>Total: {formatKES(currentOrder.totalPrice)}</Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Order Tracking</Typography>
        {steps.map((step, index) => {
          const done = index <= activeIndex;
          return (
            <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: done ? 'success.main' : 'divider',
                }}
              />
              <Typography sx={{ textTransform: 'capitalize' }}>{step}</Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 2 }}>
        {currentOrder.orderItems.map((item) => (
          <Typography key={item.product}>{item.name} x {item.quantity}</Typography>
        ))}
      </Box>

      <Typography sx={{ mt: 2 }} color="text.secondary">
        A confirmation email has been triggered by the backend mail service.
      </Typography>

      {!user && (
        <Typography sx={{ mt: 2 }}>
          Create an account to track your order. <Link to="/signup">Create Account</Link>
        </Typography>
      )}
    </Paper>
  );
};

export default OrderConfirmationPage;
