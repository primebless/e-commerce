import { prisma } from '../config/prisma.js';
import { sendEmail } from '../utils/sendEmail.js';
import { emitAutomationEvent } from './eventBus.js';
import { getAutomationKpis } from './kpiService.js';

const getAlertRecipients = () => {
  const fromEnv = String(process.env.AUTOMATION_ALERT_EMAILS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (fromEnv.length) return fromEnv;
  if (process.env.SMTP_USER) return [process.env.SMTP_USER];
  return [];
};

const formatCurrency = (value) => `KES ${Number(value || 0).toFixed(2)}`;

export const runAbandonedCartRecoveryJob = async () => {
  const now = new Date();
  const olderThan24h = new Date(now);
  olderThan24h.setHours(olderThan24h.getHours() - 24);
  const olderThan72h = new Date(now);
  olderThan72h.setHours(olderThan72h.getHours() - 72);

  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: {
        lte: olderThan24h,
        gte: olderThan72h,
      },
      items: { some: {} },
    },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: true } },
    },
    take: Number(process.env.AUTOMATION_ABANDONED_CART_LIMIT || 50),
  });

  let emailsSent = 0;
  const storefrontUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  for (const cart of carts) {
    if (!cart.user?.email) continue;

    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.product?.price || 0),
      0
    );

    const itemsHtml = cart.items
      .slice(0, 4)
      .map((item) => `<li>${item.product?.name || 'Item'} x ${item.quantity}</li>`)
      .join('');

    await sendEmail({
      to: cart.user.email,
      subject: 'You left items in your Prime cart',
      html: `<p>Hello ${cart.user.name || 'there'},</p>
             <p>You still have items waiting in your cart.</p>
             <ul>${itemsHtml}</ul>
             <p><strong>Total:</strong> ${formatCurrency(total)}</p>
             <p><a href="${storefrontUrl}/cart">Complete your checkout</a></p>`,
    });
    emailsSent += 1;
  }

  const summary = {
    scannedCarts: carts.length,
    emailsSent,
  };
  emitAutomationEvent('automation.abandonedCart.completed', summary);
  return summary;
};

export const runLowStockAlertsJob = async () => {
  const threshold = Number(process.env.AUTOMATION_LOW_STOCK_THRESHOLD || 5);
  const products = await prisma.product.findMany({
    where: { countInStock: { lte: threshold } },
    orderBy: { countInStock: 'asc' },
    take: Number(process.env.AUTOMATION_LOW_STOCK_LIMIT || 30),
  });

  const recipients = getAlertRecipients();
  if (!recipients.length) {
    return { recipients: 0, lowStockProducts: products.length, emailsSent: 0 };
  }

  const rows = products
    .map(
      (p) =>
        `<tr><td>${p.name}</td><td>${p.countInStock}</td><td>${formatCurrency(p.price)}</td></tr>`
    )
    .join('');

  if (products.length) {
    await sendEmail({
      to: recipients.join(','),
      subject: `Low stock alert (${products.length} items)`,
      html: `<p>The following products are low on stock (threshold: ${threshold}).</p>
             <table border="1" cellpadding="6" cellspacing="0">
               <tr><th>Product</th><th>Stock</th><th>Price</th></tr>
               ${rows}
             </table>`,
    });
  }

  const summary = {
    recipients: recipients.length,
    lowStockProducts: products.length,
    emailsSent: products.length ? 1 : 0,
  };
  emitAutomationEvent('automation.lowStock.completed', summary);
  return summary;
};

export const runWeeklyKpiDigestJob = async () => {
  const kpis = await getAutomationKpis();
  const recipients = getAlertRecipients();

  if (!recipients.length) {
    return {
      recipients: 0,
      emailsSent: 0,
      kpis,
    };
  }

  await sendEmail({
    to: recipients.join(','),
    subject: 'Prime Store weekly KPI digest',
    html: `<h3>Weekly performance summary</h3>
           <ul>
             <li>Revenue (today): ${formatCurrency(kpis.revenueToday)}</li>
             <li>Revenue (7d): ${formatCurrency(kpis.revenue7d)}</li>
             <li>Orders (7d): ${kpis.orders7d}</li>
             <li>Average order value (7d): ${formatCurrency(kpis.avgOrderValue7d)}</li>
             <li>New users (7d): ${kpis.users7d}</li>
             <li>Low stock products: ${kpis.lowStockCount}</li>
             <li>Open support tickets: ${kpis.openTickets}</li>
             <li>Abandoned carts (24h+): ${kpis.abandonedCarts24h}</li>
           </ul>`,
  });

  const summary = {
    recipients: recipients.length,
    emailsSent: 1,
    kpis,
  };
  emitAutomationEvent('automation.kpiDigest.completed', summary);
  return summary;
};
