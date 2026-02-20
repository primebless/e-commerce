import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

const mapCart = (cart) => ({
  _id: cart.id,
  id: cart.id,
  userId: cart.userId,
  items: (cart.items || []).map((item) => ({
    _id: item.id,
    id: item.id,
    product: item.productId,
    quantity: item.quantity,
    name: item.product?.name,
    image: item.product?.images?.[0],
    price: item.product?.price,
    brand: item.product?.brand,
    category: item.product?.category,
    rating: item.product?.rating,
    countInStock: item.product?.countInStock,
  })),
});

const getOrCreateCart = async (userId) => {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
};

export const getMyCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } },
  });

  res.json(mapCart(full));
});

export const upsertCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.countInStock < 1) {
    res.status(400);
    throw new Error('Product is out of stock');
  }

  const cart = await getOrCreateCart(req.user.id);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: Math.min(Math.max(1, Number(quantity)), product.countInStock) },
    create: { cartId: cart.id, productId, quantity: Math.min(Math.max(1, Number(quantity)), product.countInStock) },
  });

  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } },
  });

  res.json(mapCart(full));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await getOrCreateCart(req.user.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });

  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } },
  });

  res.json(mapCart(full));
});

export const mergeGuestCart = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = await getOrCreateCart(req.user.id);

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.product } });
    if (!product) continue;
    if (product.countInStock < 1) continue;

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: item.product } },
    });

    const nextQty = Math.min(
      product.countInStock,
      (existing?.quantity || 0) + Math.max(1, Number(item.quantity) || 1)
    );

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: item.product } },
      update: { quantity: nextQty },
      create: { cartId: cart.id, productId: item.product, quantity: nextQty },
    });
  }

  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } },
  });

  res.json(mapCart(full));
});
