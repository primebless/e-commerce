import express from 'express';
import {
  forgotPassword,
  getMyProfile,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  saveAddress,
  updateMyProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.post('/me/addresses', protect, saveAddress);

export default router;
