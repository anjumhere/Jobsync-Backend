import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import {
  getAllJobs,
  getJobById,
  getJobsByCompany,
  postJob,
  updateJob,
  toggleActiveJob,
} from '../controllers/jobs.controller.js';

const router = Router();
router.route('/').post(verifyJWT, postJob).get(getAllJobs);
router.route('/company/:companyId').get(getJobsByCompany);
router.route('/:id').get(getJobById).patch(verifyJWT, updateJob);
router.route('/:id/toggle-active').patch(verifyJWT, toggleActiveJob);
export default router;
