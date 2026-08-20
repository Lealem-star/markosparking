import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../../hooks/useAuth';
import { useReportQuery } from '../../../hooks/useReportQuery';
import { queryKeys } from '../../../api/queryKeys';
import { getPeriodRevenueReport } from '../../../api/api';
import { Download, DollarSign, Car } from 'lucide-react';
import {
    formatReportCurrency,
    formatReportEthiopianDate,
    groupDailyBreakdownByDate,
    sumDailyParkedCars,
} from '../../../utils/reportUtils';
import { EthiopianDatePicker } from '../../../components';
import { ReportAlert } from './reportModules';
import '../../../styles/reports.scss';

const defaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
};

const FinancialReports = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const [periodStartDate, setPeriodStartDate] = useState(defaultStartDate);
    const [periodEndDate, setPeriodEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [exportError, setExportError] = useState('');

    const { data: periodData, loading, error, load: loadPeriodReport } = useReportQuery(
        queryKeys.periodRevenue(user?.token, periodStartDate, periodEndDate),
        () => getPeriodRevenueReport(user.token, { startDate: periodStartDate, endDate: periodEndDate }),
        { enabled: Boolean(user?.token) }
    );

    const handleExportPDF = async () => {
        try {
            if (!periodData) return;

            const { exportFinancialReportToPDF } = await import('../../../utils/pdfExportReact');
            await exportFinancialReportToPDF({
                title: t('reports.periodRevenueReport'),
                subtitle: `${t('reports.from')} ${periodStartDate} ${t('reports.to')} ${periodEndDate}`,
                data: periodData,
                filename: `period-revenue-${periodStartDate}-${periodEndDate}.pdf`,
                type: 'period',
            });
        } catch (exportError) {
            console.error('Error exporting PDF:', exportError);
            setExportError(t('reports.failedToExport'));
        }
    };

    const sortedDates = periodData?.dailyBreakdown
        ? groupDailyBreakdownByDate(periodData.dailyBreakdown)
        : [];

    return (
        <div className="financial-reports">
            <ReportAlert error={error || exportError} />

            <div className="report-section">
                <div className="report-header">
                    <h2>{t('reports.periodRevenueReport')}</h2>
                    <EthiopianDatePicker
                        value={periodStartDate}
                        onChange={setPeriodStartDate}
                        label={t('reports.startDate')}
                        className="date-input"
                    />
                    <span>{t('reports.to')}</span>
                    <EthiopianDatePicker
                        value={periodEndDate}
                        onChange={setPeriodEndDate}
                        label={t('reports.endDate')}
                        className="date-input"
                    />
                    <button onClick={loadPeriodReport} className="btn-refresh" disabled={loading}>
                        {loading ? t('common.loading') : t('common.refresh')}
                    </button>
                    {periodData && (
                        <button onClick={handleExportPDF} className="btn-export">
                            <Download size={16} />
                            {t('reports.exportPDF')}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading">{t('reports.loadingReport')}</div>
                ) : periodData ? (
                    <div className="report-content">
                        <div className="stats-grid">
                            <div className="stat-card revenue">
                                <div className="stat-icon">
                                    <DollarSign size={24} />
                                </div>
                                <div className="stat-info">
                                    <h3>{formatReportCurrency(periodData.totalRevenue)}</h3>
                                    <p>{t('admin.totalRevenue')}</p>
                                </div>
                            </div>
                            <div className="stat-card cars">
                                <div className="stat-icon">
                                    <Car size={24} />
                                </div>
                                <div className="stat-info">
                                    <h3>{sumDailyParkedCars(periodData.dailyBreakdown)}</h3>
                                    <p>{t('admin.totalCarParked')}</p>
                                </div>
                            </div>
                        </div>

                        {sortedDates.length > 0 && (
                            <div className="report-table-section">
                                <h3>{t('admin.dailyBreakdown')}</h3>
                                {sortedDates.map((date) => (
                                    <div key={date} className="daily-breakdown-group">
                                        <h4 className="date-header">{formatReportEthiopianDate(date)}</h4>
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('dashboard.parkZoneCode')}</th>
                                                    <th>{t('dashboard.valetOfficerName')}</th>
                                                    <th>{t('dashboard.dailyParkedCar')}</th>
                                                    <th>{t('dashboard.dailyRevenue')}</th>
                                                    <th>{t('dashboard.vat')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {periodData.dailyBreakdown
                                                    .filter((item) => item.date === date)
                                                    .map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>{item.parkZoneCode}</td>
                                                            <td>{item.valetName}</td>
                                                            <td>{item.dailyParkedCar}</td>
                                                            <td>{formatReportCurrency(item.dailyRevenue)}</td>
                                                            <td>{formatReportCurrency(item.dailyVAT)}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-data">{t('reports.noDataForPeriod')}</div>
                )}
            </div>
        </div>
    );
};

export default FinancialReports;
