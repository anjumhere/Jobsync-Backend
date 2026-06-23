import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
} from '../controllers/company.controller.js';

const router = Router();
router.route('/').post(verifyJWT, upload.single('logo'), createCompany);
router.route('/').get(getAllCompanies);
router.route('/:id').get(getCompanyById);
export default router;
