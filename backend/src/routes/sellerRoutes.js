import express from 'express';
import {
  createSellerProduct,
  getSellerOverview,
  getSellerProducts,
  requestSellerAccess,
} from '../controllers/sellerController.js';
import { approvedSellerOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/request-access', requestSellerAccess);
router.get('/overview', approvedSellerOnly, getSellerOverview);
router.get('/products', approvedSellerOnly, getSellerProducts);
router.post('/products', approvedSellerOnly, createSellerProduct);

export default router;
