import { Router } from 'express';
import { applyToJob } from '../controllers/application.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/:jobId').post(verifyJWT, applyToJob);

export default router;
