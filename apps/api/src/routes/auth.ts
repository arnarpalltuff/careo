import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rateLimit';
import * as authService from '../services/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/\d/, 'Password must contain at least 1 number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).regex(/\d/),
});

const updateMeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

const pushTokenSchema = z.object({
  pushToken: z.string().min(1),
});

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body.email, req.body.password);
    res.json(result);
  })
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.json(result);
  })
);

router.post(
  '/logout',
  authenticate,
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    await authService.logoutUser(req.body.refreshToken, req.user!.userId);
    res.json({ message: 'Logged out successfully' });
  })
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'If an account exists with that email, a reset code has been sent' });
  })
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.email, req.body.code, req.body.newPassword);
    res.json({ message: 'Password reset successfully' });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  })
);

router.patch(
  '/me',
  authenticate,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.updateMe(req.user!.userId, req.body);
    res.json({ user });
  })
);

router.put(
  '/push-token',
  authenticate,
  validate(pushTokenSchema),
  asyncHandler(async (req, res) => {
    await authService.savePushToken(req.user!.userId, req.body.pushToken);
    res.json({ message: 'Push token saved' });
  })
);

export default router;
