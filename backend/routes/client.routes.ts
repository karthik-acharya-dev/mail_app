import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getClients, createClient } from '../controllers/client.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getClients);
router.post('/', createClient);

export default router;
