const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, validate } = require('../middleware');
const parkZoneController = require('../controllers/parkZoneController');

const router = Router();

router.get('/', isLoggedIn, asyncHandler(parkZoneController.listParkZones));

router.post(
    '/',
    isLoggedIn,
    validate(parkZoneController.createParkZoneSchema),
    asyncHandler(parkZoneController.createParkZone)
);

router.put(
    '/:id',
    isLoggedIn,
    validate(parkZoneController.updateParkZoneSchema),
    asyncHandler(parkZoneController.updateParkZone)
);

router.delete(
    '/:id',
    isLoggedIn,
    asyncHandler(parkZoneController.deleteParkZone)
);

module.exports = router;
