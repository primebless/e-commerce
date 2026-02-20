import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prisma.js';

const faq = [
  { id: 1, question: 'How long does delivery take?', answer: 'Standard delivery takes 2-5 business days depending on your location.' },
  { id: 2, question: 'Can I return a product?', answer: 'Yes. You can request returns within the allowed return window on your order.' },
  { id: 3, question: 'How do refunds work?', answer: 'Refunds are processed back to your original payment method after return approval.' },
  { id: 4, question: 'How do I track my order?', answer: 'Go to your account order history and open the order tracking timeline.' },
];

export const getFaq = asyncHandler(async (req, res) => {
  res.json(faq);
});

export const submitSupportTicket = asyncHandler(async (req, res) => {
  const { name, email, subject, message, orderId } = req.body || {};
  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('name, email, subject and message are required');
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user?.id || null,
      name,
      email,
      subject,
      message,
      orderId: orderId || null,
      status: 'open',
    },
  });
  res.status(201).json(ticket);
});

export const getMySupportTickets = asyncHandler(async (req, res) => {
  const items = await prisma.supportTicket.findMany({
    where: { email: req.user.email },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});
