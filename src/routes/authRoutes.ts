import { Router } from 'express';
import {
  signup,
  login,
  requestPasswordReset,
  resetPassword,
  updateProfileAvatar,
  removeProfileAvatar,
  getProfileInformation,
  updateProfileInformation,
  removeAccount,
  updatePassword
} from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.put('/update-profile-avatar', updateProfileAvatar);
router.delete('/remove-profile-avatar', removeProfileAvatar);
router.get('/profile', getProfileInformation);
router.put('/profile', updateProfileInformation);
router.delete('/remove-account', removeAccount);
router.post('/update-password', updatePassword);

export default router;
