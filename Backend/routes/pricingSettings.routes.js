const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, validate } = require('../middleware');
const pricingSettingsController = require('../controllers/pricingSettingsController');

const router = Router();

router.get('/', asyncHandler(pricingSettingsController.getSettings));

router.put(
    '/',
    isLoggedIn,
    validate(pricingSettingsController.updatePricingSchema),
    asyncHandler(pricingSettingsController.updateSettings)
);

module.exports = router;
