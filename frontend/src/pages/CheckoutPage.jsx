import { Alert, Box, Button, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { removePurchasedFromCart, saveShippingAddress, setCartItems, setPaymentMethod } from '../features/cartSlice';
import { createOrder, markPaid } from '../features/ordersSlice';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/client';
import { toast } from '../utils/toast';
import { KENYA_COUNTRY, KENYA_DELIVERY_LOCATIONS } from '../data/kenyaLocations';
import { formatKES } from '../utils/currency';

// Checkout page with guest/registered checkout options.
const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items, checkoutSelection, shippingAddress, paymentMethod } = useSelector((state) => state.cart);
  const { currentOrder, loading } = useSelector((state) => state.orders);
  const checkoutItems = items.filter((item) => checkoutSelection.includes(item.product));

  const [mode, setMode] = useState(user ? 'account' : 'choice');
  const [form, setForm] = useState(
    shippingAddress || {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: KENYA_DELIVERY_LOCATIONS[0]?.town || '',
      postalCode: '',
      country: KENYA_COUNTRY,
      branchId: '',
      branchName: '',
      branchArea: '',
    }
  );
  const [paymentInfo, setPaymentInfo] = useState('');
  const [cardData, setCardData] = useState({ cardNumber: '', expiryDate: '', cvc: '' });
  const [paypalEmail, setPaypalEmail] = useState(user?.email || '');
  const [isCheckingMpesa, setIsCheckingMpesa] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const selectedTown = KENYA_DELIVERY_LOCATIONS.find((row) => row.town === form.city);
  const townBranches = selectedTown?.branches || [];

  const itemsPrice = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxPrice = Number((itemsPrice * 0.1).toFixed(2));
  const deliveryPriceMap = { standard: itemsPrice > 100 ? 0 : 10, express: 20, pickup: 4 };
  const shippingPrice = deliveryPriceMap[deliveryMethod] ?? 10;
  const discountPrice = coupon?.discount || 0;
  const totalPrice = Math.max(0, itemsPrice + taxPrice + shippingPrice - discountPrice);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.info('Enter a coupon code first');
      return;
    }
    try {
      const { data } = await api.post('/promotions/validate-coupon', {
        code: couponCode,
        subtotal: itemsPrice,
      });
      setCoupon(data);
      toast.success(`Coupon ${data.code} applied`);
    } catch (error) {
      setCoupon(null);
      toast.error(error.response?.data?.message || 'Invalid coupon');
    }
  };

  const placeOrder = async () => {
    try {
      if (!form.fullName || !form.email || !form.phone || !form.city || !form.postalCode || !form.country) {
        toast.error('Please fill all shipping fields');
        return;
      }
      if (deliveryMethod !== 'pickup' && !form.address) {
        toast.error('Please enter your delivery address');
        return;
      }
      if (deliveryMethod === 'pickup' && !form.branchId) {
        toast.error('Please select a pickup branch');
        return;
      }

      dispatch(saveShippingAddress(form));

      if (!checkoutItems.length) {
        toast.error('No selected cart items to checkout');
        navigate('/cart');
        return;
      }

      if (paymentMethod === 'visa' && (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvc)) {
        toast.error('Enter card number, expiry date and CVC for Visa payment');
        return;
      }
      if (paymentMethod === 'paypal' && !paypalEmail) {
        toast.error('Enter your PayPal email');
        return;
      }

      const backendPaymentMethod = paymentMethod === 'visa' || paymentMethod === 'mpesa' ? 'intasend' : paymentMethod;
      const payload = {
        orderItems: checkoutItems,
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: deliveryMethod === 'pickup' ? `${form.branchName}, ${form.branchArea}` : form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
          deliveryMethod,
          branchId: form.branchId || null,
          branchName: form.branchName || null,
          branchArea: form.branchArea || null,
        },
        paymentMethod: backendPaymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        discountPrice,
        totalPrice,
        ...(user ? {} : { guestEmail: form.email }),
      };
      const purchasedProductIds = checkoutItems.map((item) => item.product);
      if (paymentMethod === 'mpesa') {
        setIsCheckingMpesa(true);
        setPaymentInfo('Sending M-Pesa STK push to your phone...');
        const stk = await api.post('/payments/intasend/stk-push', {
          amount: totalPrice,
          phone: form.phone,
          email: form.email,
          fullName: form.fullName,
        });

        if (!stk.data?.configured) {
          setIsCheckingMpesa(false);
          setPaymentInfo('IntaSend keys are missing on backend. Add keys in backend/.env, then retry payment.');
          toast.error('M-Pesa not configured yet');
          return;
        }
        if (!stk.data?.invoiceId) {
          setIsCheckingMpesa(false);
          toast.error('Could not get invoice ID from M-Pesa STK push');
          return;
        }

        setPaymentInfo('STK push sent. Enter M-Pesa PIN on your phone to complete payment...');
        let paid = false;
        let failed = false;
        let failedReason = '';
        for (let i = 0; i < 12; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          try {
            const statusRes = await api.get(`/payments/intasend/stk-status/${stk.data.invoiceId}`);
            if (statusRes.data?.isPaid) {
              paid = true;
              break;
            }
            if (statusRes.data?.isFailed) {
              failed = true;
              failedReason = statusRes.data?.message || statusRes.data?.state || 'Payment was canceled or failed';
              break;
            }
            setPaymentInfo('Waiting for M-Pesa confirmation...');
          } catch (statusError) {
            // Keep polling because status endpoints can be briefly unavailable.
            setPaymentInfo('Checking payment status...');
            failedReason = statusError.response?.data?.message || '';
          }
        }

        setIsCheckingMpesa(false);
        if (failed) {
          setPaymentInfo(`Payment canceled or failed: ${failedReason}`);
          toast.error(`M-Pesa payment failed: ${failedReason}`);
          return;
        }
        if (!paid) {
          setPaymentInfo('Payment not completed yet. If you canceled the STK prompt, retry payment.');
          toast.error('M-Pesa payment not confirmed');
          return;
        }

        setPaymentInfo('Payment confirmed. Creating your order...');
        const action = await dispatch(createOrder(payload));
        if (action.meta.requestStatus !== 'fulfilled') {
          toast.error(String(action.payload || 'Order failed after payment'));
          return;
        }

        await dispatch(markPaid({
          id: action.payload._id,
          paymentResult: { provider: 'intasend', channel: 'mpesa', status: 'paid', invoiceId: stk.data.invoiceId },
        }));

        if (user) {
          try {
            await api.post('/auth/me/addresses', payload.shippingAddress);
          } catch {
            // Non-blocking.
          }
        }

        if (user?.token) {
          try {
            const { data } = await api.get('/cart');
            dispatch(setCartItems(data.items || []));
          } catch {
            dispatch(removePurchasedFromCart(purchasedProductIds));
          }
        } else {
          dispatch(removePurchasedFromCart(purchasedProductIds));
        }
        toast.success('Payment received and order confirmed');
        navigate(`/order-confirmation/${action.payload._id}`, { state: { isGuest: !user } });
        return;
      }

      const action = await dispatch(createOrder(payload));
      if (action.meta.requestStatus !== 'fulfilled') {
        toast.error(String(action.payload || 'Order failed'));
        return;
      }

      if (user) {
        try {
          await api.post('/auth/me/addresses', payload.shippingAddress);
        } catch {
          // Non-blocking.
        }
      }

      if (paymentMethod === 'visa') {
        const session = await api.post('/payments/intasend/initiate', {
          amount: totalPrice,
          orderId: action.payload._id,
          email: form.email,
          fullName: form.fullName,
          phone: form.phone,
          channel: 'visa',
        });

        if (!session.data?.configured) {
          setPaymentInfo('IntaSend keys are missing on backend. Add keys in backend/.env, then retry payment.');
          toast.info('IntaSend keys not set yet. Order saved as pending payment.');
        } else if (session.data?.checkoutUrl) {
          setPaymentInfo('Opening Visa checkout...');
          window.open(session.data.checkoutUrl, '_blank', 'noopener,noreferrer');
          toast.info('Complete card payment then refresh order status.');
        } else {
          setPaymentInfo('Visa payment is configured. Connect frontend SDK with your IntaSend public key.');
        }
      }
      if (paymentMethod === 'paypal') {
        setPaymentInfo(`PayPal checkout email: ${paypalEmail}. Connect your PayPal API flow here.`);
      }

      if (user?.token) {
        try {
          const { data } = await api.get('/cart');
          dispatch(setCartItems(data.items || []));
        } catch {
          dispatch(removePurchasedFromCart(purchasedProductIds));
        }
      } else {
        dispatch(removePurchasedFromCart(purchasedProductIds));
      }
      toast.success('Order placed successfully');
      navigate(`/order-confirmation/${action.payload._id}`, { state: { isGuest: !user } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Order failure');
    }
  };

  if (!user && mode === 'choice') {
    return (
      <Paper sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Choose Checkout Method</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button variant="contained" onClick={() => setMode('guest')}>Continue as Guest</Button>
          <Button variant="outlined" onClick={() => navigate('/login')}>Login</Button>
          <Button variant="outlined" onClick={() => navigate('/signup')}>Create Account</Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' } }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{user ? 'Checkout' : 'Guest Checkout'}</Typography>
        {paymentMethod === 'mpesa' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Paying <strong>PRIME</strong> securely via <strong>IntaSend (M-Pesa STK)</strong>.
          </Alert>
        )}
        <TextField
          fullWidth
          sx={{ mb: 1 }}
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
        />
        <TextField
          fullWidth
          sx={{ mb: 1 }}
          label="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <TextField
          fullWidth
          sx={{ mb: 1 }}
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        {deliveryMethod !== 'pickup' && (
          <TextField
            fullWidth
            sx={{ mb: 1 }}
            label="Delivery Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        )}
        <Select
          fullWidth
          value={form.country}
          sx={{ mb: 1 }}
          onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
        >
          <MenuItem value={KENYA_COUNTRY}>{KENYA_COUNTRY}</MenuItem>
        </Select>
        <Select
          fullWidth
          value={form.city}
          sx={{ mb: 1 }}
          onChange={(e) => {
            const town = e.target.value;
            setForm((prev) => ({ ...prev, city: town, branchId: '', branchName: '', branchArea: '' }));
          }}
        >
          {KENYA_DELIVERY_LOCATIONS.map((row) => (
            <MenuItem key={row.town} value={row.town}>{row.town}</MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          sx={{ mb: 1 }}
          label="Postal Code"
          value={form.postalCode}
          onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
        />
        {deliveryMethod === 'pickup' && (
          <Select
            fullWidth
            value={form.branchId}
            sx={{ mb: 1 }}
            onChange={(e) => {
              const next = townBranches.find((b) => b.id === e.target.value);
              setForm((prev) => ({
                ...prev,
                branchId: next?.id || '',
                branchName: next?.name || '',
                branchArea: next?.area || '',
              }));
            }}
          >
            <MenuItem value="">Select Pickup Branch</MenuItem>
            {townBranches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name} - {branch.area}
              </MenuItem>
            ))}
          </Select>
        )}

        <Typography variant="subtitle1" sx={{ mt: 1 }}>Payment Method</Typography>
        <Select fullWidth value={paymentMethod} onChange={(e) => dispatch(setPaymentMethod(e.target.value))}>
          <MenuItem value="visa">Visa Card</MenuItem>
          <MenuItem value="mpesa">M-Pesa</MenuItem>
          <MenuItem value="paypal">PayPal</MenuItem>
          <MenuItem value="cod">Cash on Delivery</MenuItem>
        </Select>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Delivery Method</Typography>
        <Select fullWidth value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
          <MenuItem value="standard">Standard Delivery</MenuItem>
          <MenuItem value="express">Express Delivery</MenuItem>
          <MenuItem value="pickup">Pickup Point</MenuItem>
        </Select>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.6, display: 'block' }}>
          Available branches are in Kenya towns: Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret.
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            label="Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
          />
          <Button variant="outlined" onClick={applyCoupon}>Apply</Button>
        </Box>
        {coupon && (
          <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
            Applied {coupon.code}: -{formatKES(coupon.discount)}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          <Box
            component="img"
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Visa_2021.svg"
            alt="Visa"
            sx={{ height: 28 }}
          />
          <Box
            component="img"
            src="https://commons.wikimedia.org/wiki/Special:FilePath/M-PESA_LOGO-01.svg"
            alt="M-Pesa"
            sx={{ height: 28 }}
          />
          <Box
            component="img"
            src="https://commons.wikimedia.org/wiki/Special:FilePath/PayPal.svg"
            alt="PayPal"
            sx={{ height: 28 }}
          />
        </Box>

        {paymentMethod === 'visa' && (
          <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
            <TextField
              fullWidth
              label="Card Number"
              placeholder="4111 1111 1111 1111"
              value={cardData.cardNumber}
              onChange={(e) => setCardData((prev) => ({ ...prev, cardNumber: e.target.value }))}
            />
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}>
              <TextField
                fullWidth
                label="Expiry Date"
                placeholder="MM/YY"
                value={cardData.expiryDate}
                onChange={(e) => setCardData((prev) => ({ ...prev, expiryDate: e.target.value }))}
              />
              <TextField
                fullWidth
                label="CVC"
                placeholder="123"
                value={cardData.cvc}
                onChange={(e) => setCardData((prev) => ({ ...prev, cvc: e.target.value }))}
              />
            </Box>
          </Box>
        )}

        {paymentMethod === 'paypal' && (
          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="PayPal Email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
          />
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Order Summary</Typography>
        <Typography>Items: {formatKES(itemsPrice)}</Typography>
        <Typography>Tax: {formatKES(taxPrice)}</Typography>
        <Typography>Delivery ({deliveryMethod}): {formatKES(shippingPrice)}</Typography>
        {discountPrice > 0 && <Typography>Discount: -{formatKES(discountPrice)}</Typography>}
        <Typography variant="h5" sx={{ mt: 1 }}>Total: {formatKES(totalPrice)}</Typography>

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={placeOrder} disabled={!checkoutItems.length || loading || isCheckingMpesa}>
          {loading ? 'Placing...' : isCheckingMpesa ? 'Waiting for M-Pesa...' : 'Place Order'}
        </Button>

        {paymentInfo && <Alert sx={{ mt: 2 }}>{paymentInfo}</Alert>}
        {currentOrder && <Typography sx={{ mt: 1 }}>Latest order: {currentOrder._id}</Typography>}
      </Paper>
    </Box>
  );
};

export default CheckoutPage;
