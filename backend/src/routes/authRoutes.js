import express from "express";
import rateLimit from "express-rate-limit";
import {
	login,
	registerCustomer,
	registerMerchant,
	requestOtp,
	verifyEmail,
	verifyOtp,
	forgotPassword,
  	resetPassword,
	getProfile,
	updateProfile,
	changePassword,
	deleteAccount,
	refreshAccessToken,
	logout,
	logoutAll,
	getSession,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
	loginSchema,
	customerSignupSchema,
	merchantSignupSchema,
	otpRequestSchema,
	otpVerifySchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	updateProfileSchema,
	changePasswordSchema,
} from "../validators/authSchemas.js";

const router = express.Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

const otpLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
});

// Stricter rate limit for token refresh to prevent abuse
const refreshLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10, // 10 refresh attempts per minute
	standardHeaders: true,
	legacyHeaders: false,
});

router.use(authLimiter);

// Public auth routes
router.post("/signup/customer", validate(customerSignupSchema), registerCustomer);
router.post("/signup/merchant", validate(merchantSignupSchema), registerMerchant);
router.post("/login", validate(loginSchema), login);
router.post("/otp/request", otpLimiter, validate(otpRequestSchema), requestOtp);
router.post("/otp/verify", otpLimiter, validate(otpVerifySchema), verifyOtp);
router.get("/verify/:token", verifyEmail);
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), resetPassword);

// Token refresh route (public - uses refresh token for auth)
router.post('/refresh', refreshLimiter, refreshAccessToken);

// Logout route (public - can work without access token)
router.post('/logout', logout);

// Session validation (requires valid access token)
router.get('/session', protect, getSession);

// Protected routes (require valid access token)
router.get('/me', protect, getProfile);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);
router.delete('/me', protect, deleteAccount);

// Logout from all devices (requires valid access token)
router.post('/logout-all', protect, logoutAll);

export default router;

export default router;
