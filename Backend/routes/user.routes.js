const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const userController = require('../controllers/userController');

const router = Router();

router.post('/register', asyncHandler(userController.registerDisabled));
router.post('/create', isLoggedIn, validate(userController.createUserSchema), asyncHandler(userController.createUser));
router.get('/', isLoggedIn, attachCurrentUser, requireRoles('system_admin', 'manager'), asyncHandler(userController.listUsers));
router.post('/login', validate(userController.loginSchema), asyncHandler(userController.login));
router.post('/resetPassword/:id', isLoggedIn, attachCurrentUser, validate(userController.resetPasswordSchema), asyncHandler(userController.resetPassword));

router.post(
    '/:id/upload-photo',
    isLoggedIn,
    attachCurrentUser,
    userController.uploadPhotoMiddleware,
    asyncHandler(userController.uploadPhoto)
);

router.put('/:id', isLoggedIn, attachCurrentUser, validate(userController.updateUserSchema), asyncHandler(userController.updateUser));
router.delete('/delete/:id', isLoggedIn, asyncHandler(userController.deactivateUser));

module.exports = router;
