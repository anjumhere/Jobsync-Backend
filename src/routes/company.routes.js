import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  getMyCompanies,
  updateMyCompany,
  updateCompanyLogo,
  deleteCompany,
} from '../controllers/company.controller.js';

const router = Router();
router
  .route('/')
  .post(verifyJWT, upload.single('logo'), createCompany)
  .get(getAllCompanies);
router.route('/my-companies').get(verifyJWT, getMyCompanies);
router
  .route('/:id')
  .get(getCompanyById)
  .patch(verifyJWT, updateMyCompany)
  .delete(verifyJWT, deleteCompany);
router
  .route('/:id/logo')
  .patch(verifyJWT, upload.single('logo'), updateCompanyLogo);

export default router;
