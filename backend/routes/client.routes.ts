import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getClients, createClient, deleteClient, getClientEmails } from '../controllers/client.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getClients);
router.post('/', createClient);
router.delete('/:id', deleteClient);
router.get('/:id/emails', getClientEmails);

export default router;
