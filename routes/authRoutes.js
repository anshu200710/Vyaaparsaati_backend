import express from 'express';
import { register, verifyEmail, login, resendVerificationCode, logout, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

export default router;
