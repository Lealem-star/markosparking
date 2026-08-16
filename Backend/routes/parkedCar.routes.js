const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, validate } = require('../middleware');
const parkedCarController = require('../controllers/parkedCarController');

const router = Router();

router.post(
    '/',
    isLoggedIn,
    attachCurrentUser,
    validate(parkedCarController.createParkedCarSchema),
    asyncHandler(parkedCarController.create)
);

router.get('/', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.list));
router.get(
    '/transactions',
    isLoggedIn,
    attachCurrentUser,
    validate(parkedCarController.listTransactionsSchema, 'query'),
    asyncHandler(parkedCarController.transactions)
);
router.get('/flagged', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.listFlagged));
router.get('/stats/daily', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.getDaily));
router.get('/stats/daily/history', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.getDailyHistory));
router.get('/:id', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.getById));

router.put(
    '/:id',
    isLoggedIn,
    attachCurrentUser,
    validate(parkedCarController.updateParkedCarSchema),
    asyncHandler(parkedCarController.update)
);

router.delete('/:id', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.remove));
router.put('/:id/flag', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.flag));
router.post(
    '/:id/resolve',
    isLoggedIn,
    attachCurrentUser,
    validate(parkedCarController.resolveFlaggedSchema),
    asyncHandler(parkedCarController.resolve)
);
router.post('/:id/notify', isLoggedIn, attachCurrentUser, asyncHandler(parkedCarController.notify));

module.exports = router;
