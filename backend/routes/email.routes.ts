import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getEmails, syncEmails, sendEmail, linkToClient, searchEmails } from '../controllers/email.controller';

const router = Router();

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get('/', getEmails);
router.post('/sync', syncEmails);
router.post('/send', upload.array('attachments'), sendEmail);
router.post('/link', linkToClient);
router.get('/search', searchEmails);

export default router;
