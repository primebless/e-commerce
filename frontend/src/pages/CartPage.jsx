import { Box, Button, Chip, Divider, IconButton, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  removeFromCart,
  selectAllCheckoutItems,
  setCartItems,
  setCheckoutSelection,
  toggleCheckoutItem,
  updateQty,
} from '../features/cartSlice';
import api from '../api/client';
import { toast } from '../utils/toast';
import { formatKES } from '../utils/currency';

// Shopping cart with real-time updates and total calculation.
const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items, checkoutSelection } = useSelector((state) => state.cart);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const selectedItems = items.filter((item) => checkoutSelection.includes(item.product));
  const selectedSubtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const allSelected = items.length > 0 && checkoutSelection.length === items.length;
  const estimatedTax = Number((selectedSubtotal * 0.1).toFixed(2));
  const estimatedDelivery = selectedSubtotal > 10000 ? 0 : 450;
  const estimatedTotal = selectedSubtotal + estimatedTax + estimatedDelivery;

  const updateQuantity = async (productId, quantity) => {
    if (user?.token) {
      const { data } = await api.post('/cart/item', { productId, quantity });
      dispatch(setCartItems(data.items));
    } else {
      dispatch(updateQty({ productId, quantity }));
    }
  };

  const removeItem = async (productId) => {
    if (user?.token) {
      const { data } = await api.delete(`/cart/item/${productId}`);
      dispatch(setCartItems(data.items));
    } else {
      dispatch(removeFromCart(productId));
    }
  };

  const saveForLater = async (productId) => {
    if (!user?.token) {
      toast.info('Login required to save items for later');
      return;
    }

    await api.post('/users/wishlist/toggle', { productId });
    const { data } = await api.delete(`/cart/item/${productId}`);
    dispatch(setCartItems(data.items));
    toast.success('Moved to wishlist');
  };

  const proceedSelected = () => {
    if (selectedItems.length === 0) {
      toast.info('Select at least one item to checkout');
      return;
    }
    navigate('/checkout');
  };

  const proceedAll = () => {
    dispatch(selectAllCheckoutItems());
    navigate('/checkout');
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="h4">Your Cart</Typography>

      {items.length === 0 ? (
        <Typography>Cart is empty. <Link to="/products">Go shopping</Link></Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1.4fr 0.8fr' } }}>
          <Box>
            <Paper sx={{ p: 1.2, mb: 1.2, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button
                  variant={allSelected ? 'outlined' : 'text'}
                  onClick={() => {
                    if (allSelected) dispatch(setCheckoutSelection([]));
                    else dispatch(selectAllCheckoutItems());
                  }}
                >
                  {allSelected ? 'Unselect All' : 'Select All'}
                </Button>
                <Chip size="small" label={`${selectedItems.length} selected`} color={selectedItems.length ? 'primary' : 'default'} />
                <Typography variant="body2" color="text.secondary">Tap any card to select it for checkout</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 700 }}>{formatKES(selectedSubtotal)}</Typography>
            </Paper>

            {items.map((item) => (
              <Paper
                key={item.product}
                onClick={() => dispatch(toggleCheckoutItem(item.product))}
                sx={{
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: checkoutSelection.includes(item.product) ? 'primary.main' : 'divider',
                  bgcolor: checkoutSelection.includes(item.product) ? 'action.selected' : 'background.paper',
                  boxShadow: checkoutSelection.includes(item.product) ? '0 0 0 2px rgba(25,118,210,0.15)' : 'none',
                }}
              >
                <img src={item.image} alt={item.name} style={{ width: 98, height: 98, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.3, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                    {checkoutSelection.includes(item.product) && <Chip size="small" color="primary" label="Selected" />}
                  </Stack>
                  <Typography color="primary" sx={{ fontWeight: 700, mb: 0.4 }}>{formatKES(item.price)}</Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ mb: 0.6 }}>
                    {item.brand && <Chip size="small" label={item.brand} />}
                    {item.category && <Chip size="small" label={item.category} />}
                    <Chip
                      size="small"
                      color={item.countInStock > 0 ? 'success' : 'error'}
                      label={item.countInStock > 0 ? `In stock (${item.countInStock})` : 'Out of stock'}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" onClick={(e) => e.stopPropagation()}>
                    <Typography variant="body2" color="text.secondary">Qty</Typography>
                    <Select
                      size="small"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product, Number(e.target.value))}
                    >
                      {[...Array(10).keys()].map((q) => (
                        <MenuItem key={q + 1} value={q + 1}>{q + 1}</MenuItem>
                      ))}
                    </Select>
                  </Stack>
                </Box>

                <Stack justifyContent="space-between" alignItems="flex-end" onClick={(e) => e.stopPropagation()}>
                  <Typography sx={{ fontWeight: 700 }}>{formatKES(item.price * item.quantity)}</Typography>
                  <Stack direction="row" spacing={0.4}>
                    <IconButton color="error" onClick={() => removeItem(item.product)}>
                      <DeleteIcon />
                    </IconButton>
                    <Button size="small" onClick={() => saveForLater(item.product)}>
                      Save
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>

          <Paper
            sx={{
              p: 2,
              height: 'fit-content',
              position: { lg: 'sticky' },
              top: { lg: 88 },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={0.4} alignItems="center" justifyContent="center" sx={{ mb: 1.2 }}>
              <Box
                component="img"
                src="/prime-logo.svg"
                alt="Prime Store"
                sx={{ width: 42, height: 42, objectFit: 'contain' }}
              />
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.4, color: '#0d9488', fontSize: 20 }}>
                PRIME
              </Typography>
            </Stack>

            <Typography variant="h6" sx={{ mb: 1 }}>Checkout Summary</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              You can pay selected items now, then come back for the rest later.
            </Typography>

            <Stack spacing={0.7}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Cart subtotal</Typography>
                <Typography>{formatKES(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Selected subtotal</Typography>
                <Typography>{formatKES(selectedSubtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Estimated tax</Typography>
                <Typography>{formatKES(estimatedTax)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Estimated delivery</Typography>
                <Typography>{formatKES(estimatedDelivery)}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 700 }}>Estimated total</Typography>
              <Typography sx={{ fontWeight: 700 }}>{formatKES(estimatedTotal)}</Typography>
            </Box>

            <Stack spacing={1}>
              <Button
                variant="contained"
                size="large"
                onClick={proceedSelected}
                disabled={selectedItems.length === 0}
                fullWidth
              >
                Checkout Selected
              </Button>
              <Button variant="outlined" onClick={proceedAll} fullWidth>
                Checkout All
              </Button>
              <Typography variant="caption" color="text.secondary">
                Secure checkout via PRIME and IntaSend
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default CartPage;
