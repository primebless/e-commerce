import { prisma } from '../config/prisma.js';

// Persists an audit log entry for security and activity tracking.
export const logAction = async ({ action, userId, details, req }) => {
  try {
    await prisma.actionLog.create({
      data: {
        action,
        userId,
        details,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (error) {
    // Avoid blocking core user flow when logging fails.
    console.error('Failed to write action log:', error.message);
  }
};
