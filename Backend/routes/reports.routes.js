const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const reportsController = require('../controllers/reportsController');

const router = Router();

router.get('/financial/daily', ...reportsController.adminReportAccess, asyncHandler(reportsController.getFinancialDaily));
router.get('/financial/period', ...reportsController.adminReportAccess, asyncHandler(reportsController.getFinancialPeriod));
router.get('/financial/plate-code', ...reportsController.adminReportAccess, asyncHandler(reportsController.getFinancialPlateCode));
router.get('/financial/payment-methods', ...reportsController.adminReportAccess, asyncHandler(reportsController.getFinancialPaymentMethods));
router.get('/operational/activity', ...reportsController.adminReportAccess, asyncHandler(reportsController.getOperationalActivity));
router.get('/operational/duration', ...reportsController.adminReportAccess, asyncHandler(reportsController.getOperationalDuration));
router.get('/operational/location', ...reportsController.adminReportAccess, asyncHandler(reportsController.getOperationalLocation));
router.get('/operational/peak-hours', ...reportsController.adminReportAccess, asyncHandler(reportsController.getOperationalPeakHours));
router.get('/operational/plate-code-distribution', ...reportsController.adminReportAccess, asyncHandler(reportsController.getOperationalPlateCodeDistribution));
router.get('/customer/vehicle-history', ...reportsController.adminReportAccess, asyncHandler(reportsController.getCustomerVehicleHistory));
router.get('/customer/activity', ...reportsController.adminReportAccess, asyncHandler(reportsController.getCustomerActivity));
router.get('/administrative/users', ...reportsController.parkingManagerReportAccess, asyncHandler(reportsController.getAdministrativeUsers));
router.get('/administrative/parking-officer-performance', ...reportsController.adminReportAccess, asyncHandler(reportsController.getAdministrativeParkingOfficerPerformance));
router.get('/administrative/valet-performance', ...reportsController.adminReportAccess, asyncHandler(reportsController.getAdministrativeParkingOfficerPerformance));
router.get('/compliance/transactions', ...reportsController.adminReportAccess, asyncHandler(reportsController.getComplianceTransactions));
router.get('/compliance/system-activity', ...reportsController.systemAdminOnly, asyncHandler(reportsController.getComplianceSystemActivity));

module.exports = router;
