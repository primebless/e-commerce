import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

const sanitizeUser = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isSeller: user.isSeller,
  sellerApproved: user.sellerApproved,
  sellerApprovalRequestedAt: user.sellerApprovalRequestedAt,
  sellerApprovedAt: user.sellerApprovedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Protects routes by requiring a valid JWT token.
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized: missing token');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    res.status(401);
    throw new Error('Not authorized: user not found');
  }

  req.user = sanitizeUser(user);
  next();
});

// Adds authenticated user if token exists; allows anonymous access otherwise.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) req.user = sanitizeUser(user);
  } catch {
    // Ignore token errors for optional auth routes.
  }

  next();
});

// Restricts routes to admin users only.
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  next();
};

// Restricts routes to sellers approved by admin.
export const approvedSellerOnly = (req, res, next) => {
  if (!req.user?.isSeller) {
    res.status(403);
    throw new Error('Seller account required');
  }

  if (!req.user?.sellerApproved) {
    res.status(403);
    throw new Error('Seller account pending admin approval');
  }

  next();
};
