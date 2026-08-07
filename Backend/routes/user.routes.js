const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const { STAFF_MANAGEMENT_ROLES } = require('../constants/roles');
const userController = require('../controllers/userController');

const router = Router();

router.post('/register', asyncHandler(userController.registerDisabled));
router.post(
    '/create',
    isLoggedIn,
    attachCurrentUser,
    validate(userController.createUserSchema),
    asyncHandler(userController.createUser)
);
router.get(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...STAFF_MANAGEMENT_ROLES),
    asyncHandler(userController.listUsers)
);
router.get(
    '/me',
    isLoggedIn,
    attachCurrentUser,
    asyncHandler(userController.getCurrentUser)
);
router.post('/login', validate(userController.loginSchema), asyncHandler(userController.login));
router.post(
    '/resetPassword/:id',
    isLoggedIn,
    attachCurrentUser,
    validate(userController.resetPasswordSchema),
    asyncHandler(userController.resetPassword)
);

router.post(
    '/:id/upload-photo',
    isLoggedIn,
    attachCurrentUser,
    userController.uploadPhotoMiddleware,
    asyncHandler(userController.uploadPhoto)
);

router.put(
    '/:id',
    isLoggedIn,
    attachCurrentUser,
    validate(userController.updateUserSchema),
    asyncHandler(userController.updateUser)
);
router.delete(
    '/delete/:id',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...STAFF_MANAGEMENT_ROLES),
    asyncHandler(userController.deactivateUser)
);

module.exports = router;
