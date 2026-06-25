import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import {
  getAllJobs,
  getJobById,
  postJob,
} from '../controllers/jobs.controller.js';

const router = Router();
router.route('/').post(verifyJWT, postJob).get(getAllJobs);
router.route('/:id').get(getJobById);
export default router;
