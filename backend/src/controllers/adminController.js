import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

// Provides aggregate metrics for admin dashboard charts.
export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [usersCount, productsCount, ordersCount, revenueStats, statusStats, topProducts, lowStock] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.product.findMany({ orderBy: [{ rating: 'desc' }, { numReviews: 'desc' }], take: 5 }),
    prisma.product.findMany({ where: { countInStock: { lte: 5 } }, orderBy: { countInStock: 'asc' }, take: 10 }),
  ]);

  res.json({
    usersCount,
    productsCount,
    ordersCount,
    revenue: revenueStats._sum.totalPrice || 0,
    orderStatusBreakdown: statusStats.map((row) => ({ _id: row.status, count: row._count._all })),
    topProducts: topProducts.map((product) => ({ _id: product.id, name: product.name, rating: product.rating })),
    lowStock: lowStock.map((product) => ({ _id: product.id, name: product.name, countInStock: product.countInStock })),
  });
});

// Admin lists all users.
export const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    users.map((user) => ({
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
    }))
  );
});

// Admin updates a user's role/profile.
export const updateUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name ?? user.name,
      email: req.body.email ?? user.email,
      role: req.body.role ?? user.role,
      isSeller: req.body.isSeller ?? user.isSeller,
      sellerApproved: req.body.sellerApproved ?? user.sellerApproved,
      sellerApprovalRequestedAt: req.body.sellerApprovalRequestedAt ?? user.sellerApprovalRequestedAt,
      sellerApprovedAt: req.body.sellerApprovedAt ?? user.sellerApprovedAt,
    },
  });

  res.json({
    _id: updated.id,
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isSeller: updated.isSeller,
    sellerApproved: updated.sellerApproved,
    sellerApprovalRequestedAt: updated.sellerApprovalRequestedAt,
    sellerApprovedAt: updated.sellerApprovedAt,
  });
});

// Admin approves a pending seller request.
export const approveSeller = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      isSeller: true,
      sellerApproved: true,
      sellerApprovedAt: new Date(),
      sellerApprovalRequestedAt: user.sellerApprovalRequestedAt ?? new Date(),
    },
  });

  res.json({
    _id: updated.id,
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isSeller: updated.isSeller,
    sellerApproved: updated.sellerApproved,
    sellerApprovalRequestedAt: updated.sellerApprovalRequestedAt,
    sellerApprovedAt: updated.sellerApprovedAt,
  });
});

// Admin rejects or revokes seller access.
export const rejectSeller = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      isSeller: false,
      sellerApproved: false,
      sellerApprovalRequestedAt: null,
      sellerApprovedAt: null,
    },
  });

  res.json({
    _id: updated.id,
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isSeller: updated.isSeller,
    sellerApproved: updated.sellerApproved,
    sellerApprovalRequestedAt: updated.sellerApprovalRequestedAt,
    sellerApprovedAt: updated.sellerApprovedAt,
  });
});

// Admin deletes a user account.
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'User removed' });
});

// Admin gets recent action logs with optional action filter.
export const getActionLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 30);
  const action = req.query.action;

  const where = action ? { action } : {};
  const [total, logs] = await Promise.all([
    prisma.actionLog.count({ where }),
    prisma.actionLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    logs: logs.map((log) => ({
      _id: log.id,
      id: log.id,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: log.user
        ? {
            _id: log.user.id,
            id: log.user.id,
            name: log.user.name,
            email: log.user.email,
            role: log.user.role,
          }
        : null,
    })),
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// Admin gets report aggregates for action logs.
export const getActionReport = asyncHandler(async (req, res) => {
  const [actionSummaryRaw, dailyRaw] = await Promise.all([
    prisma.actionLog.groupBy({
      by: ['action'],
      _count: { _all: true },
    }),
    prisma.$queryRaw`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as day,
             "action",
             COUNT(*)::int as count
      FROM "ActionLog"
      GROUP BY day, "action"
      ORDER BY day DESC
      LIMIT 60
    `,
  ]);

  const actionSummary = actionSummaryRaw.map((item) => ({
    action: item.action,
    count: item._count._all,
  }));

  res.json({
    actionSummary,
    dailyActivity: dailyRaw,
  });
});

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const created = await prisma.coupon.create({
    data: {
      code: String(req.body.code || '').trim().toUpperCase(),
      type: req.body.type,
      value: Number(req.body.value),
      minSubtotal: Number(req.body.minSubtotal || 0),
      expiresAt: new Date(req.body.expiresAt),
      isActive: req.body.isActive !== false,
    },
  });
  res.status(201).json(created);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  const updated = await prisma.coupon.update({
    where: { id: req.params.id },
    data: {
      code: req.body.code ? String(req.body.code).trim().toUpperCase() : existing.code,
      type: req.body.type ?? existing.type,
      value: req.body.value !== undefined ? Number(req.body.value) : existing.value,
      minSubtotal: req.body.minSubtotal !== undefined ? Number(req.body.minSubtotal) : existing.minSubtotal,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : existing.expiresAt,
      isActive: req.body.isActive ?? existing.isActive,
    },
  });
  res.json(updated);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ message: 'Coupon removed' });
});

export const getSupportTickets = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const where = status ? { status } : {};
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(tickets);
});

export const updateSupportTicket = asyncHandler(async (req, res) => {
  const existing = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Support ticket not found');
  }

  const updated = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status ?? existing.status,
      subject: req.body.subject ?? existing.subject,
      message: req.body.message ?? existing.message,
    },
  });
  res.json(updated);
});
