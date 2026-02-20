import express from 'express';
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  markOrderDelivered,
  markOrderPaid,
} from '../controllers/orderController.js';
import { adminOnly, optionalAuth, protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(optionalAuth, createOrder).get(protect, adminOnly, getAllOrders);
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, markOrderPaid);
router.put('/:id/deliver', protect, adminOnly, markOrderDelivered);

export default router;
