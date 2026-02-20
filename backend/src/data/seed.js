import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { sampleProducts } from './sampleData.js';

dotenv.config();

// Seeds demo users and products into PostgreSQL.
const run = async () => {
  await prisma.$connect();

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.actionLog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.flashBanner.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  // Preserve existing accounts; only ensure demo users exist and are up to date.
  await prisma.user.upsert({
    where: { email: 'admin@mernstore.dev' },
    update: {
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
    },
    create: {
      name: 'Admin User',
      email: 'admin@mernstore.dev',
      password: adminPassword,
      role: 'admin',
      savedAddresses: [],
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@mernstore.dev' },
    update: {
      name: 'Demo User',
      password: userPassword,
      role: 'user',
    },
    create: {
      name: 'Demo User',
      email: 'user@mernstore.dev',
      password: userPassword,
      role: 'user',
      savedAddresses: [],
    },
  });

  await prisma.product.createMany({
    data: sampleProducts,
  });

  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 30, expiresAt: new Date('2027-01-01'), isActive: true },
      { code: 'PRIME15', type: 'percent', value: 15, minSubtotal: 80, expiresAt: new Date('2027-01-01'), isActive: true },
      { code: 'SAVE5', type: 'fixed', value: 5, minSubtotal: 20, expiresAt: new Date('2027-01-01'), isActive: true },
    ],
  });

  await prisma.flashBanner.createMany({
    data: [
      {
        title: 'Flash Sale: Electronics',
        subtitle: 'Up to 35% off select gadgets today',
        cta: '/products?category=Electronics&sort=popularity',
        color: '#0f766e',
        priority: 1,
        isActive: true,
      },
      {
        title: 'Weekend Fashion Drop',
        subtitle: 'Fresh styles with limited-time discounts',
        cta: '/products?category=Footwear',
        color: '#ea580c',
        priority: 2,
        isActive: true,
      },
    ],
  });

  console.log('Seed complete');
  await prisma.$disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
