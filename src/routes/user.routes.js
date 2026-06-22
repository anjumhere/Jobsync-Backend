import { Router } from 'express';
import { upload } from '../middleware/multer.middleware.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  changeUserAvatar,
  changeUserCoverImage,
  updateResume,
  updateSkill,
  removeSkill,
  bookMarkJob,
  removeBookmarkedJob,
  getSavedJobs,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();
router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(verifyJWT, refreshAccessToken);
router.route('/change-password').post(verifyJWT, changePassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-account').patch(verifyJWT, updateAccountDetails);
router
  .route('/avatar')
  .patch(verifyJWT, upload.single('avatar'), changeUserAvatar);
router
  .route('/cover-image')
  .patch(verifyJWT, upload.single('coverImage'), changeUserCoverImage);
router.route('/resume').patch(verifyJWT, upload.single('resume'), updateResume);
router.route('/skills').post(verifyJWT, updateSkill);
router.route('/skills/:skill').delete(verifyJWT, removeSkill);
router.route('/saved-jobs/:jobId').post(verifyJWT, bookMarkJob);
router.route('/saved-jobs/:jobId').delete(verifyJWT, removeBookmarkedJob);
router.route('/saved-jobs').get(verifyJWT, getSavedJobs);
export default router;
