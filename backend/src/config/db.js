import { prisma } from './prisma.js';

// Connects the API to PostgreSQL through Prisma.
export const connectDB = async () => {
  await prisma.$connect();
  console.log('PostgreSQL connected via Prisma');
};
