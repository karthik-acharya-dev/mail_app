import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getEmails, syncEmails, sendEmail, linkToClient, unlinkFromClient, searchEmails, saveDraft, toggleStar, deleteEmail, toggleReadStatus, downloadAttachment } from '../controllers/email.controller';

const router = Router();

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get('/', getEmails);
router.post('/sync', syncEmails);
router.post('/send', upload.array('attachments'), sendEmail);
router.post('/save-draft', saveDraft);
router.post('/toggle-star', toggleStar);
router.post('/delete', deleteEmail);
router.post('/toggle-read', toggleReadStatus);
router.post('/link', linkToClient);
router.post('/unlink', unlinkFromClient);
router.get('/search', searchEmails);
router.get('/attachment', downloadAttachment);

export default router;
