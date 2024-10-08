import { Router } from 'express';
import { signup, login, requestPasswordReset, resetPassword, updateProfileAvatar, removeProfileAvatar, getProfileInformation,updateProfileInformation ,removeAccount} from '../controllers/authController'; // Updated path, removed ".ts" extension

// Create a new Router instance
const router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *               password:
 *                 type: string
 *                 example: securepassword
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Email already in use
 */
router.post('/signup', signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *               password:
 *                 type: string
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid email or password
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request a password reset OTP
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       400:
 *         description: Email not found
 */
router.post('/request-password-reset', requestPasswordReset);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: newsecurepassword
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: Password reset successfully.
 *                 token:
 *                   type: string
 *                   example: your_jwt_token_here
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: testuser@example.com
 *       400:
 *         description: Invalid OTP or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Invalid OTP or user not found.
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /auth/update-profile-avatar:
 *   put:
 *     summary: Update user's profile avatar
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The new profile avatar image file
 *     responses:
 *       200:
 *         description: Profile avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: Profile avatar updated successfully.
 *       400:
 *         description: Failed to update profile avatar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Failed to update profile avatar.
 */
router.put('/update-profile-avatar', updateProfileAvatar);

/**
 * @swagger
 * /auth/remove-profile-avatar:
 *   delete:
 *     summary: Remove user's profile avatar
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Profile avatar removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: Profile avatar removed successfully.
 *       400:
 *         description: Failed to remove profile avatar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Failed to remove profile avatar.
 */
router.delete('/remove-profile-avatar', removeProfileAvatar);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user's profile information
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Profile information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     avatarUrl:
 *                       type: string
 *                       example: /uploads/avatar.jpg
 *                     email:
 *                       type: string
 *                       example: testuser@example.com
 *       400:
 *         description: Failed to retrieve profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve profile information.
 */
router.get('/profile', getProfileInformation);


/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user's profile information
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: testuser@example.com
 *     responses:
 *       200:
 *         description: Profile information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: Profile information updated successfully.
 *                 user:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: testuser@example.com
 *       400:
 *         description: Failed to update profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Failed to update profile information.
 */
router.put('/profile', updateProfileInformation);
/**
 * @swagger
 * /auth/remove-account:
 *   delete:
 *     summary: Remove user's account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Account removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: Account removed successfully.
 *       400:
 *         description: Failed to remove account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Failed to remove account.
 */
router.delete('/remove-account', removeAccount);


export default router;