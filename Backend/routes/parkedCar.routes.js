const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, validate } = require('../middleware');
const parkedCarController = require('../controllers/parkedCarController');

const router = Router();

router.post(
    '/',
    isLoggedIn,
    validate(parkedCarController.createParkedCarSchema),
    asyncHandler(parkedCarController.create)
);

router.get('/', isLoggedIn, asyncHandler(parkedCarController.list));
router.get('/flagged', isLoggedIn, asyncHandler(parkedCarController.listFlagged));
router.get('/stats/daily', isLoggedIn, asyncHandler(parkedCarController.getDaily));
router.get('/stats/daily/history', isLoggedIn, asyncHandler(parkedCarController.getDailyHistory));
router.get('/:id', isLoggedIn, asyncHandler(parkedCarController.getById));

router.put(
    '/:id',
    isLoggedIn,
    validate(parkedCarController.updateParkedCarSchema),
    asyncHandler(parkedCarController.update)
);

router.delete('/:id', isLoggedIn, asyncHandler(parkedCarController.remove));
router.put('/:id/flag', isLoggedIn, asyncHandler(parkedCarController.flag));
router.post('/:id/notify', isLoggedIn, asyncHandler(parkedCarController.notify));

module.exports = router;
