import express from 'express';
import {
  createIntaSendCheckout,
  createIntaSendStkPush,
  getIntaSendStkStatus,
  handleIntaSendWebhook,
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/intasend/webhook', handleIntaSendWebhook);
router.post('/intasend/initiate', createIntaSendCheckout);
router.post('/intasend/stk-push', createIntaSendStkPush);
router.get('/intasend/stk-status/:invoiceId', getIntaSendStkStatus);

// Backward-compatible aliases so existing frontend calls won't break.
router.post('/webhook', handleIntaSendWebhook);
router.post('/create-intent', createIntaSendCheckout);

export default router;
