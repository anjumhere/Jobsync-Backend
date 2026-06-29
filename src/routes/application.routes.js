import { Router } from 'express';
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} from '../controllers/application.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/:jobId').post(verifyJWT, applyToJob);
router.route('/my-applications').get(verifyJWT, getMyApplications);
router.route('/job/:jobId').get(verifyJWT, getJobApplications);
router.route('/:id/status').patch(verifyJWT, updateApplicationStatus);
export default router;
