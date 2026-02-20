import express from 'express';
import { getFlashBanners, validateCoupon } from '../controllers/promoController.js';

const router = express.Router();

router.get('/banners', getFlashBanners);
router.post('/validate-coupon', validateCoupon);

export default router;
