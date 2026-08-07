const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn } = require('../middleware');

const userRoutes = require('./user.routes');
const paymentMethodRoutes = require('./paymentMethod.routes');
const paymentRoutes = require('./payment.routes');
const parkedCarRoutes = require('./parkedCar.routes');
const smsRoutes = require('./sms.routes');
const pricingSettingsRoutes = require('./pricingSettings.routes');
const reportsRoutes = require('./reports.routes');
const chatRoutes = require('./chat.routes');
const parkZoneRoutes = require('./parkZone.routes');
const attendanceRoutes = require('./attendance.routes');
const incidentRoutes = require('./incident.routes');
const auditLogRoutes = require('./auditLog.routes');
const shiftReconciliationRoutes = require('./shiftReconciliation.routes');

const router = Router();

router.get('/', isLoggedIn, asyncHandler(async (req, res) => {
    res.json({ message: 'Hello world!' });
}));

router.use('/user', userRoutes);
router.use('/paymentMethod', paymentMethodRoutes);
router.use('/payment', paymentRoutes);
router.use('/parkedCar', parkedCarRoutes);
router.use('/sms', smsRoutes);
router.use('/pricingSettings', pricingSettingsRoutes);
router.use('/reports', reportsRoutes);
router.use('/chat', chatRoutes);
router.use('/parkZone', parkZoneRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/incidents', incidentRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/shift-reconciliations', shiftReconciliationRoutes);

module.exports = router;
