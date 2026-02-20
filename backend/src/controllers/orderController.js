import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';
import { sendEmail } from '../utils/sendEmail.js';
import { logAction } from '../utils/logAction.js';

const PLATFORM_COMMISSION_RATE = 0.1;

const normalizeKenyaPhone = (value) => {
  const raw = String(value || '').trim().replace(/\s+/g, '');
  const digits = raw.replace(/[^\d+]/g, '');
  const noPlus = digits.startsWith('+') ? digits.slice(1) : digits;

  if (/^254\d{9}$/.test(noPlus)) return noPlus;
  if (/^0\d{9}$/.test(noPlus)) return `254${noPlus.slice(1)}`;
  if (/^\d{9}$/.test(noPlus)) return `254${noPlus}`;
  return noPlus;
};

const pickIntaSendError = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return String(data.errors[0]?.detail || data.errors[0]?.message || data.errors[0]);
  }
  return String(data.detail || data.message || data.error || '');
};

const normalizePaymentState = (value) => String(value || '').toLowerCase();

const mapOrderItem = (item) => ({
  _id: item.id,
  id: item.id,
  product: item.productId,
  name: item.name,
  image: item.image,
  price: item.price,
  quantity: item.quantity,
  sellerName: item.sellerName,
  grossAmount: Number((Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)),
  platformCommission: Number((Number(item.price || 0) * Number(item.quantity || 0) * PLATFORM_COMMISSION_RATE).toFixed(2)),
  sellerEarning: Number((Number(item.price || 0) * Number(item.quantity || 0) * (1 - PLATFORM_COMMISSION_RATE)).toFixed(2)),
});

const mapOrder = (order) => ({
  _id: order.id,
  id: order.id,
  user: order.user
    ? {
        _id: order.user.id,
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      }
    : null,
  isGuest: order.isGuest,
  guestEmail: order.guestEmail,
  guestFullName: order.guestFullName,
  guestPhone: order.guestPhone,
  orderItems: (order.orderItems || []).map(mapOrderItem),
  shippingAddress: order.shippingAddress,
  paymentMethod: order.paymentMethod,
  paymentResult: order.paymentResult,
  itemsPrice: order.itemsPrice,
  taxPrice: order.taxPrice,
  shippingPrice: order.shippingPrice,
  totalPrice: order.totalPrice,
  isPaid: order.isPaid,
  paidAt: order.paidAt,
  isDelivered: order.isDelivered,
  deliveredAt: order.deliveredAt,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

// Creates order for guest or registered user and decrements stock safely.
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice, guestEmail } = req.body;

  if (!orderItems?.length) {
    res.status(400);
    throw new Error('No order items');
  }

  if (!req.user && !guestEmail) {
    res.status(400);
    throw new Error('Guest checkout requires email');
  }

  const preparedItems = [];
  for (const item of orderItems) {
    const product = await prisma.product.findUnique({ where: { id: item.product } });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const qty = Math.max(1, Number(item.quantity) || 1);
    if (qty > product.countInStock) {
      res.status(400);
      throw new Error(`Out of stock: ${product.name}`);
    }

    preparedItems.push({ product, qty, item });
  }

  const created = await prisma.$transaction(async (tx) => {
    for (const row of preparedItems) {
      await tx.product.update({
        where: { id: row.product.id },
        data: { countInStock: { decrement: row.qty } },
      });
    }

    const order = await tx.order.create({
      data: {
        userId: req.user?.id || null,
        isGuest: !req.user,
        guestEmail: req.user ? req.user.email : guestEmail,
        guestFullName: shippingAddress.fullName,
        guestPhone: shippingAddress.phone || '',
        shippingAddress,
        paymentMethod: paymentMethod || 'intasend',
        itemsPrice: Number(itemsPrice),
        taxPrice: Number(taxPrice),
        shippingPrice: Number(shippingPrice),
        totalPrice: Number(totalPrice),
        orderItems: {
          create: preparedItems.map((row) => {
            const unitPrice = Number(row.item.price || row.product.price);
            const grossAmount = Number((unitPrice * row.qty).toFixed(2));
            const platformCommission = Number((grossAmount * PLATFORM_COMMISSION_RATE).toFixed(2));
            const sellerEarning = Number((grossAmount - platformCommission).toFixed(2));

            return {
              productId: row.product.id,
              name: row.item.name || row.product.name,
              image: row.item.image || row.product.images[0] || '',
              price: unitPrice,
              quantity: row.qty,
            };
          }),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: true,
      },
    });

    if (req.user) {
      const userCart = await tx.cart.findUnique({ where: { userId: req.user.id } });
      if (userCart) {
        const purchasedProductIds = preparedItems.map((row) => row.product.id);
        await tx.cartItem.deleteMany({
          where: { cartId: userCart.id, productId: { in: purchasedProductIds } },
        });
      }
    }

    return order;
  });

  await sendEmail({
    to: created.guestEmail,
    subject: `Order Created #${created.id}`,
    html: `<p>Your order was placed successfully. Total: KES ${created.totalPrice.toFixed(2)}</p>`,
  });

  if (req.user) {
    await logAction({
      action: 'PURCHASE',
      userId: req.user.id,
      details: `Order ${created.id} placed. Total: KES ${created.totalPrice.toFixed(2)}`,
      req,
    });
  }

  res.status(201).json(mapOrder(created));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { orderItems: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders.map(mapOrder));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      orderItems: true,
    },
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.json(mapOrder(order));
});

export const markOrderPaid = asyncHandler(async (req, res) => {
  const existing = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { email: true, name: true } }, orderItems: true },
  });

  if (!existing) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (existing.isPaid) {
    res.json(mapOrder(existing));
    return;
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      isPaid: true,
      paidAt: new Date(),
      status: 'paid',
      paymentResult: req.body,
    },
    include: { user: { select: { id: true, name: true, email: true } }, orderItems: true },
  });

  await sendEmail({
    to: existing.guestEmail || existing.user?.email,
    subject: `Payment confirmed #${existing.id}`,
    html: `<p>Payment confirmed for order #${existing.id}.</p>`,
  });

  res.json(mapOrder(updated));
});

export const markOrderDelivered = asyncHandler(async (req, res) => {
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Order not found');
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      isDelivered: true,
      deliveredAt: new Date(),
      status: 'delivered',
    },
    include: { orderItems: true },
  });

  res.json(mapOrder(updated));
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      orderItems: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders.map(mapOrder));
});

// IntaSend checkout bootstrap endpoint.
// This keeps key handling on backend and returns frontend-safe config.
export const createIntaSendCheckout = asyncHandler(async (req, res) => {
  const { amount, orderId, email, fullName, phone } = req.body;
  const publicKey = process.env.INTASEND_PUBLIC_KEY || '';
  const secretKey = process.env.INTASEND_SECRET_KEY || '';
  const checkoutUrl = process.env.INTASEND_CHECKOUT_URL || '';
  const testMode = String(process.env.INTASEND_TEST_MODE || 'true').toLowerCase() === 'true';
  const businessName = process.env.INTASEND_BUSINESS_NAME || 'Prime Store';
  const safeBusinessRef = businessName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PRIMESTORE';

  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Amount is required');
  }

  if (!publicKey || !secretKey) {
    res.json({
      provider: 'intasend',
      configured: false,
      message: 'IntaSend keys are missing. Add INTASEND_PUBLIC_KEY and INTASEND_SECRET_KEY in backend .env.',
      amount: Number(amount),
      orderId: orderId || null,
    });
    return;
  }

  res.json({
    provider: 'intasend',
    configured: true,
    publicKey,
    testMode,
    checkoutUrl: checkoutUrl || null,
    amount: Number(amount),
    orderId: orderId || null,
    customer: {
      email: email || null,
      fullName: fullName || null,
      phone: phone || null,
    },
    reference: orderId || `${safeBusinessRef}-${Date.now()}`,
  });
});

// Starts an IntaSend M-Pesa STK push to the customer's phone.
export const createIntaSendStkPush = asyncHandler(async (req, res) => {
  const { amount, phone, email, fullName, currency = 'KES', apiRef } = req.body || {};
  const publicKey = process.env.INTASEND_PUBLIC_KEY || '';
  const secretKey = process.env.INTASEND_SECRET_KEY || '';
  const stkPushUrl = process.env.INTASEND_STK_PUSH_URL || 'https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/';
  const businessName = process.env.INTASEND_BUSINESS_NAME || 'Prime Store';
  const safeBusinessRef = businessName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PRIMESTORE';

  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Amount is required');
  }
  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required for M-Pesa STK push');
  }
  const normalizedPhone = normalizeKenyaPhone(phone);
  if (!/^254\d{9}$/.test(normalizedPhone)) {
    res.status(400);
    throw new Error('Use a valid Kenya phone number, e.g. 0712345678 or 254712345678');
  }

  if (!publicKey || !secretKey) {
    res.json({
      provider: 'intasend',
      channel: 'mpesa',
      configured: false,
      message: 'IntaSend keys are missing. Add INTASEND_PUBLIC_KEY and INTASEND_SECRET_KEY in backend .env.',
    });
    return;
  }

  const payload = {
    public_key: publicKey,
    amount: Number(amount),
    currency,
    phone_number: normalizedPhone,
    email: email || '',
    first_name: fullName ? String(fullName).split(' ')[0] : '',
    last_name: fullName ? String(fullName).split(' ').slice(1).join(' ') : '',
    api_ref: apiRef || `${safeBusinessRef}-${Date.now()}`,
  };

  const response = await fetch(stkPushUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = pickIntaSendError(data);
    console.error('IntaSend STK push failed', {
      status: response.status,
      statusText: response.statusText,
      payload: { ...payload, phone_number: normalizedPhone },
      response: data,
    });
    res.status(400);
    throw new Error(detail || 'Failed to initiate M-Pesa STK push');
  }

  const invoiceId = data?.invoice?.invoice_id || data?.invoice_id || data?.id || null;
  res.json({
    provider: 'intasend',
    channel: 'mpesa',
    configured: true,
    invoiceId,
    status: data?.state || data?.status || 'PENDING',
    raw: data,
  });
});

// Checks IntaSend payment status for a given invoice reference.
export const getIntaSendStkStatus = asyncHandler(async (req, res) => {
  const invoiceId = req.params.invoiceId || req.query.invoiceId;
  const secretKey = process.env.INTASEND_SECRET_KEY || '';
  const statusUrlBase = process.env.INTASEND_STK_STATUS_URL || 'https://sandbox.intasend.com/api/v1/payment/status/';

  if (!invoiceId) {
    res.status(400);
    throw new Error('invoiceId is required');
  }
  if (!secretKey) {
    res.status(503);
    throw new Error('IntaSend secret key is missing');
  }

  const statusUrl = statusUrlBase.includes('{invoiceId}')
    ? statusUrlBase.replace('{invoiceId}', encodeURIComponent(invoiceId))
    : `${statusUrlBase}${statusUrlBase.includes('?') ? '&' : '?'}invoice_id=${encodeURIComponent(invoiceId)}`;

  const response = await fetch(statusUrl, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = pickIntaSendError(data);
    const normalized = normalizePaymentState(data?.state || data?.status || detail);
    const isFailed = ['failed', 'cancelled', 'canceled', 'declined'].includes(normalized);

    // IntaSend may return non-2xx for transient lookup states; keep polling safely.
    if (!isFailed) {
      res.json({
        invoiceId,
        state: 'PENDING',
        isPaid: false,
        isFailed: false,
        message: detail || 'Payment still pending confirmation',
        raw: data,
      });
      return;
    }

    res.json({
      invoiceId,
      state: data?.state || data?.status || 'FAILED',
      isPaid: false,
      isFailed: true,
      message: detail || 'Payment failed',
      raw: data,
    });
    return;
  }

  const normalized = normalizePaymentState(data?.state || data?.status || '');
  const isPaid = ['complete', 'completed', 'success', 'succeeded', 'paid'].includes(normalized);
  const isFailed = ['failed', 'cancelled', 'canceled', 'declined'].includes(normalized);

  res.json({
    invoiceId,
    state: data?.state || data?.status || 'PENDING',
    isPaid,
    isFailed,
    raw: data,
  });
});

// IntaSend webhook endpoint placeholder.
// Expected payload: { orderId, status, paymentId, ...providerPayload }.
export const handleIntaSendWebhook = asyncHandler(async (req, res) => {
  const { orderId, status, paymentId } = req.body || {};

  if (!orderId) {
    res.status(400);
    throw new Error('orderId is required in webhook payload');
  }

  const normalized = String(status || '').toLowerCase();
  const isSuccess = ['succeeded', 'success', 'paid', 'complete', 'completed'].includes(normalized);

  if (isSuccess) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (existing && !existing.isPaid) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          status: 'paid',
          paymentResult: req.body || { provider: 'intasend', paymentId, status },
        },
      });
    }
  }

  res.json({ received: true });
});
