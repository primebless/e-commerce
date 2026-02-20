import express from 'express';
import {
  approveSeller,
  createCoupon,
  deleteCoupon,
  deleteUser,
  getActionLogs,
  getActionReport,
  getAdminAnalytics,
  getCoupons,
  getSupportTickets,
  getUsers,
  rejectSeller,
  updateCoupon,
  updateSupportTicket,
  updateUser,
} from '../controllers/adminController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/analytics', getAdminAnalytics);
router.get('/logs', getActionLogs);
router.get('/reports', getActionReport);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/support-tickets', getSupportTickets);
router.put('/support-tickets/:id', updateSupportTicket);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/approve-seller', approveSeller);
router.put('/users/:id/reject-seller', rejectSeller);
router.delete('/users/:id', deleteUser);

export default router;
