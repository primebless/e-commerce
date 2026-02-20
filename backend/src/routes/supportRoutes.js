import express from 'express';
import { getFaq, getMySupportTickets, submitSupportTicket } from '../controllers/supportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/faq', getFaq);
router.post('/tickets', submitSupportTicket);
router.get('/tickets/mine', protect, getMySupportTickets);

export default router;
