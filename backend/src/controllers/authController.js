import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import { logAction } from '../utils/logAction.js';

const toSafeUser = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isSeller: user.isSeller,
  sellerApproved: user.sellerApproved,
  sellerApprovalRequestedAt: user.sellerApprovalRequestedAt,
  sellerApprovedAt: user.sellerApprovedAt,
  savedAddresses: user.savedAddresses || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Registers a new user and returns auth token.
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, savedAddresses: [] },
  });

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Prime Store',
    html: `<h2>Welcome, ${user.name}</h2><p>Your account was created successfully.</p>`,
  });

  await logAction({
    action: 'CREATE_ACCOUNT',
    userId: user.id,
    details: `New account created: ${user.email}`,
    req,
  });

  res.status(201).json({
    ...toSafeUser(user),
    token: generateToken({ id: user.id }),
  });
});

// Authenticates an existing user.
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  await logAction({
    action: 'LOGIN',
    userId: user.id,
    details: `User logged in: ${user.email}`,
    req,
  });

  res.json({
    ...toSafeUser(user),
    token: generateToken({ id: user.id }),
  });
});

// Returns profile for currently authenticated user.
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(toSafeUser(user));
});

// Updates logged-in user profile data.
export const updateMyProfile = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existing) {
    res.status(404);
    throw new Error('User not found');
  }

  const updateData = {
    name: req.body.name ?? existing.name,
    email: req.body.email ?? existing.email,
  };

  if (req.body.password) {
    updateData.password = await bcrypt.hash(req.body.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
  });

  res.json({
    ...toSafeUser(updated),
    token: generateToken({ id: updated.id }),
  });
});

// Saves a shipping address on authenticated user profile.
export const saveAddress = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const current = Array.isArray(user.savedAddresses) ? user.savedAddresses : [];
  const next = [req.body, ...current.filter((row) => JSON.stringify(row) !== JSON.stringify(req.body))].slice(0, 5);

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { savedAddresses: next },
  });

  res.json(updated.savedAddresses);
});

// Generates and emails a password reset token.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.json({ message: 'If that email exists, reset instructions were sent.' });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
  });

  res.json({ message: 'Password reset email sent' });
});

// Resets password using a valid reset token.
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    res.status(400);
    throw new Error('Token invalid or expired');
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  res.json({ message: 'Password reset successful' });
});

// Logs out a user for audit tracking on admin logs page.
export const logoutUser = asyncHandler(async (req, res) => {
  await logAction({
    action: 'LOGOUT',
    userId: req.user.id,
    details: `User logged out: ${req.user.email}`,
    req,
  });

  res.json({ message: 'Logout logged successfully' });
});
