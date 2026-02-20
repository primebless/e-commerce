import express from 'express';
import { getMyCart, mergeGuestCart, removeCartItem, upsertCartItem } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getMyCart);
router.post('/item', upsertCartItem);
router.delete('/item/:productId', removeCartItem);
router.post('/merge', mergeGuestCart);

export default router;
