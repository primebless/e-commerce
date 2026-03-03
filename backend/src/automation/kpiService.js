import { prisma } from '../config/prisma.js';

const startOfDay = (date = new Date()) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const getAutomationKpis = async () => {
  const now = new Date();
  const today = startOfDay(now);
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const abandonedCutoff = new Date(now);
  abandonedCutoff.setHours(abandonedCutoff.getHours() - 24);

  const [
    revenueToday,
    revenue7d,
    orders7d,
    users7d,
    lowStockCount,
    openTickets,
    abandonedCarts24h,
    recoverableCarts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: last7Days } },
      _sum: { totalPrice: true },
      _avg: { totalPrice: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.product.count({ where: { countInStock: { lte: 5 } } }),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    prisma.cart.count({
      where: {
        updatedAt: { lte: abandonedCutoff },
        items: { some: {} },
      },
    }),
    prisma.cart.count({
      where: {
        updatedAt: { lte: abandonedCutoff, gte: last7Days },
        items: { some: {} },
      },
    }),
  ]);

  return {
    generatedAt: now.toISOString(),
    revenueToday: Number(revenueToday._sum.totalPrice || 0),
    revenue7d: Number(revenue7d._sum.totalPrice || 0),
    avgOrderValue7d: Number(revenue7d._avg.totalPrice || 0),
    orders7d,
    users7d,
    lowStockCount,
    openTickets,
    abandonedCarts24h,
    recoverableCarts,
  };
};
