import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

export const getFlashBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.flashBanner.findMany({
    where: { isActive: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    take: 5,
  });
  res.json(banners.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, cta: row.cta, color: row.color })));
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const rawCode = String(req.body.code || '').trim().toUpperCase();
  const subtotal = Number(req.body.subtotal || 0);

  if (!rawCode) {
    res.status(400);
    throw new Error('Coupon code is required');
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: rawCode } });
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  if (!coupon.isActive) {
    res.status(400);
    throw new Error('Coupon is not active');
  }

  if (coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error('Coupon has expired');
  }

  if (subtotal < coupon.minSubtotal) {
    res.status(400);
    throw new Error(`Minimum subtotal for this coupon is KES ${coupon.minSubtotal.toFixed(2)}`);
  }

  const discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  const safeDiscount = Math.min(discount, subtotal);

  res.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Number(safeDiscount.toFixed(2)),
  });
});
