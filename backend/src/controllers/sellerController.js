import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

const toProduct = (product) => ({
  ...product,
  _id: product.id,
});

// User requests a seller account; requires admin approval before selling.
export const requestSellerAccess = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isSeller && !user.sellerApproved) {
    res.json({ message: 'Seller request already submitted and pending admin approval' });
    return;
  }

  if (user.isSeller && user.sellerApproved) {
    res.json({ message: 'Seller account is already approved' });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isSeller: true,
      sellerApproved: false,
      sellerApprovalRequestedAt: new Date(),
      sellerApprovedAt: null,
    },
  });

  res.json({ message: 'Seller account request submitted. Wait for admin approval.' });
});

// Foundation endpoint for seller dashboard metrics.
export const getSellerOverview = asyncHandler(async (req, res) => {
  const [productsCount, ordersCount, soldItems] = await Promise.all([
    prisma.product.count({ where: { brand: { equals: req.user.name, mode: 'insensitive' } } }),
    prisma.order.count({
      where: {
        orderItems: {
          some: {
            product: {
              brand: { equals: req.user.name, mode: 'insensitive' },
            },
          },
        },
      },
    }),
    prisma.orderItem.findMany({
      where: {
        product: {
          brand: { equals: req.user.name, mode: 'insensitive' },
        },
      },
      select: { price: true, quantity: true },
    }),
  ]);

  const grossSales = soldItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const platformCommission = grossSales * 0.1;
  const sellerPayout = grossSales - platformCommission;
  const unitsSold = soldItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  res.json({
    seller: { id: req.user.id, name: req.user.name, email: req.user.email },
    productsCount,
    ordersCount,
    grossSales: Number(grossSales.toFixed(2)),
    platformCommission: Number(platformCommission.toFixed(2)),
    sellerPayout: Number(sellerPayout.toFixed(2)),
    unitsSold,
    commissionRate: 0.1,
    note: 'Marketplace deal: platform keeps 10% per sale and seller receives 90%.',
  });
});

// Seller views their product list foundation.
export const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { brand: { equals: req.user.name, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products.map(toProduct));
});

// Seller creates product foundation.
export const createSellerProduct = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    slug: req.body.slug,
    description: req.body.description,
    category: req.body.category,
    brand: req.user.name,
    price: Number(req.body.price),
    countInStock: Number(req.body.countInStock),
    images: Array.isArray(req.body.images) ? req.body.images : [],
    featured: Boolean(req.body.featured),
  };
  const created = await prisma.product.create({ data: payload });
  res.status(201).json(toProduct(created));
});
