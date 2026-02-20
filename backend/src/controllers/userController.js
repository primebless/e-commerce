import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

const mapProduct = (product) => ({
  ...product,
  _id: product.id,
});

// Toggles product in authenticated user's wishlist.
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });
  } else {
    await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        productId,
      },
    });
  }

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });

  res.json(wishlist.map((item) => mapProduct(item.product)));
});

// Returns current user's wishlist.
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });

  res.json(wishlist.map((item) => mapProduct(item.product)));
});
