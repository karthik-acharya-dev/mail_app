import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getGoogleAuthUrl, googleCallback, getConnectionStatus, disconnectAccount } from '../controllers/auth.controller';

const router = Router();

router.get('/google/url', requireAuth, getGoogleAuthUrl);
router.get('/google/callback', googleCallback); // handled by browser redirect
router.get('/status', requireAuth, getConnectionStatus);
router.post('/disconnect', requireAuth, disconnectAccount);

export default router;
