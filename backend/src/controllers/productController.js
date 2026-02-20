import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

const toProduct = (product) => ({
  ...product,
  _id: product.id,
});

// Lists products with search/filter/sort/pagination.
export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const where = {};
  if (req.query.keyword) {
    where.name = { contains: req.query.keyword, mode: 'insensitive' };
  }
  if (req.query.category) {
    where.category = req.query.category;
  }
  if (req.query.minPrice || req.query.maxPrice) {
    where.price = {
      ...(req.query.minPrice ? { gte: Number(req.query.minPrice) } : {}),
      ...(req.query.maxPrice ? { lte: Number(req.query.maxPrice) } : {}),
    };
  }
  if (req.query.minRating) {
    where.rating = { gte: Number(req.query.minRating) };
  }

  const sortMap = {
    newest: { createdAt: 'desc' },
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    rating: { rating: 'desc' },
    popularity: [{ numReviews: 'desc' }, { rating: 'desc' }],
  };
  const orderBy = sortMap[req.query.sort] || sortMap.newest;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    products: products.map(toProduct),
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// Returns one product and its related products.
export const getProductById = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const [relatedProducts, reviews] = await Promise.all([
    prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
      },
      take: 4,
    }),
    prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({
    product: toProduct(product),
    relatedProducts: relatedProducts.map(toProduct),
    reviews: reviews.map((review) => ({
      _id: review.id,
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      user: { name: review.user.name },
      createdAt: review.createdAt,
    })),
  });
});

// Admin creates product.
export const createProduct = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    price: Number(req.body.price),
    countInStock: Number(req.body.countInStock),
    images: Array.isArray(req.body.images) ? req.body.images : [],
  };
  const product = await prisma.product.create({ data: payload });
  res.status(201).json(toProduct(product));
});

// Admin updates product.
export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
      ...(req.body.countInStock !== undefined ? { countInStock: Number(req.body.countInStock) } : {}),
      ...(req.body.images !== undefined ? { images: req.body.images } : {}),
    },
  });

  res.json(toProduct(updated));
});

// Admin deletes product.
export const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Product not found');
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product removed' });
});

// Adds or updates review for a product.
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId: product.id,
      },
    },
    update: {
      rating: Number(rating),
      comment,
    },
    create: {
      rating: Number(rating),
      comment,
      userId: req.user.id,
      productId: product.id,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: {
      rating: agg._avg.rating || 0,
      numReviews: agg._count._all,
    },
  });

  res.status(201).json({ message: 'Review saved' });
});
