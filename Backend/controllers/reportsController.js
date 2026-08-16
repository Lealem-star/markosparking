const reportService = require('../services/reportService');
const { adminReportAccess, systemAdminOnly } = require('../middleware/reportAccess');

const wrap = (fn) => async (req, res) => {
    const data = await reportService[fn](req.query);
    res.json(data);
};

module.exports = {
    adminReportAccess,
    systemAdminOnly,
    getFinancialDaily: wrap('getFinancialDaily'),
    getFinancialPeriod: wrap('getFinancialPeriod'),
    getFinancialPlateCode: wrap('getFinancialPlateCode'),
    getFinancialPaymentMethods: wrap('getFinancialPaymentMethods'),
    getOperationalActivity: wrap('getOperationalActivity'),
    getOperationalDuration: wrap('getOperationalDuration'),
    getOperationalLocation: wrap('getOperationalLocation'),
    getOperationalPeakHours: wrap('getOperationalPeakHours'),
    getOperationalPlateCodeDistribution: wrap('getOperationalPlateCodeDistribution'),
    getCustomerVehicleHistory: wrap('getCustomerVehicleHistory'),
    getCustomerActivity: wrap('getCustomerActivity'),
    getAdministrativeUsers: wrap('getAdministrativeUsers'),
    getAdministrativeParkingOfficerPerformance: wrap('getAdministrativeParkingOfficerPerformance'),
    getAdministrativeValetPerformance: wrap('getAdministrativeParkingOfficerPerformance'),
    getComplianceTransactions: wrap('getComplianceTransactions'),
    getComplianceSystemActivity: wrap('getComplianceSystemActivity'),
};
