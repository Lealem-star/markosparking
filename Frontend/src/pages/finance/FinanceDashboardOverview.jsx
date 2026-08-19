import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    DollarSign,
    Smartphone,
    AlertTriangle,
    Receipt,
    Percent,
    Clock,
} from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { useParkedCarsQuery, useFlaggedCarsQuery } from '../../hooks/queries';
import { getApiError } from '../../api/client';
import { getStaffRoutePath } from '../../utils/rolePaths';
import { getLicensePlate } from '../../utils/carDisplay';
import { EthiopianDatePicker } from '../../components';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import { calculateFlaggedFee, getFlaggedStats } from '../shared/flaggedModules/flaggedUtils';
import { AGING_BUCKETS, getReceivablesAging, getDaysOutstanding } from './financeUtils';
import '../../styles/dashboardOverview.scss';
import '../../styles/financePortal.scss';

const FinanceDashboardOverview = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const transactionsPath = getStaffRoutePath(user?.type, 'transactions');
    const flaggedPath = getStaffRoutePath(user?.type, 'flagged-customers');
    const reportsPath = getStaffRoutePath(user?.type, 'reports');

    const {
        data: cars = [],
        isLoading: loadingRevenue,
        error: revenueQueryError,
    } = useParkedCarsQuery(user?.token, { date: selectedDate });

    const {
        data: flaggedCars = [],
        isLoading: loadingFlagged,
    } = useFlaggedCarsQuery(user?.token);

    const revenueError = revenueQueryError
        ? getApiError(revenueQueryError, t('finance.loadFailed'))
        : '';

    const unknownZone = t('admin.unknownZone');

    const financeStats = useMemo(() => {
        let totalRevenue = 0;
        let totalVat = 0;
        let onlineTotal = 0;
        let transactionCount = 0;

        cars.forEach((car) => {
            const paid = car.totalPaidAmount || 0;
            if (paid <= 0) return;

            transactionCount += 1;
            totalRevenue += paid;
            totalVat += car.vatAmount || 0;

            if (car.paymentMethod === 'online') {
                onlineTotal += paid;
            }
        });

        return {
            totalRevenue,
            totalVat,
            onlineTotal,
            transactionCount,
        };
    }, [cars]);

    const flaggedStats = useMemo(
        () => getFlaggedStats(flaggedCars, unknownZone),
        [flaggedCars, unknownZone]
    );

    const receivablesAging = useMemo(
        () => getReceivablesAging(flaggedCars),
        [flaggedCars]
    );

    const topFlagged = useMemo(() => {
        return [...flaggedCars]
            .sort((a, b) => calculateFlaggedFee(b).totalWithVat - calculateFlaggedFee(a).totalWithVat)
            .slice(0, 5);
    }, [flaggedCars]);

    if ((loadingRevenue || loadingFlagged) && !cars.length && !flaggedCars.length) {
        return <DashboardContentLoader />;
    }

    return (
        <div className="dashboard-overview finance-dashboard">
            <header className="finance-dashboard__header">
                <div>
                    <h1>{t('finance.dashboardTitle')}</h1>
                    <p>{t('finance.dashboardSubtitle')}</p>
                </div>
                <div className="finance-dashboard__quick-links">
                    <Link to={transactionsPath} className="finance-quick-link">
                        <Receipt size={16} />
                        {t('finance.transactionsTitle')}
                    </Link>
                    <Link to={flaggedPath} className="finance-quick-link">
                        <AlertTriangle size={16} />
                        {t('valet.flaggedCustomers')}
                    </Link>
                    <Link to={reportsPath} className="finance-quick-link">
                        {t('navigation.reports')}
                    </Link>
                    <Link to={getStaffRoutePath(user?.type, 'finance-audit-logs')} className="finance-quick-link">
                        {t('financeAuditLogs.title')}
                    </Link>
                </div>
            </header>

            <div className="stats-grid finance-stats-grid">
                <article className="stat-card stat-card--revenue">
                    <div className="stat-card-body">
                        <div className="stat-icon">
                            <DollarSign size={20} />
                        </div>
                        <div className="stat-value">{financeStats.totalRevenue.toFixed(2)}</div>
                        <div className="stat-label">{t('finance.dailyCollected')}</div>
                    </div>
                </article>

                <article className="stat-card stat-card--cars">
                    <div className="stat-card-body">
                        <div className="stat-icon">
                            <Smartphone size={20} />
                        </div>
                        <div className="stat-value">{financeStats.onlineTotal.toFixed(2)}</div>
                        <div className="stat-label">{t('finance.onlinePayments')}</div>
                    </div>
                </article>

                <article className="stat-card stat-card--revenue">
                    <div className="stat-card-body">
                        <div className="stat-icon">
                            <Percent size={20} />
                        </div>
                        <div className="stat-value">{financeStats.totalVat.toFixed(2)}</div>
                        <div className="stat-label">{t('dashboard.vat')}</div>
                    </div>
                </article>

                <article className="stat-card stat-card--flagged">
                    <div className="stat-card-body">
                        <div className="stat-icon">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="stat-value">{flaggedStats.totalOutstanding}</div>
                        <div className="stat-label">{t('finance.flaggedOutstanding')}</div>
                        <div className="finance-stat-meta">
                            {t('finance.flaggedCount', { count: flaggedStats.totalFlagged })}
                        </div>
                    </div>
                </article>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>{t('finance.dailySummary')}</h2>
                        <div className="date-selector">
                            <EthiopianDatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                label={t('dashboard.selectDate')}
                            />
                        </div>
                    </div>

                    {loadingRevenue ? (
                        <div className="chart-placeholder">
                            <p>{t('dashboard.loadingRevenueData')}</p>
                        </div>
                    ) : revenueError ? (
                        <div className="chart-placeholder">
                            <p>{revenueError}</p>
                        </div>
                    ) : (
                        <ul className="finance-summary-list">
                            <li>
                                <span>{t('finance.paidCheckouts')}</span>
                                <strong>{financeStats.transactionCount}</strong>
                            </li>
                            <li>
                                <span>{t('finance.onlineShare')}</span>
                                <strong>
                                    {financeStats.totalRevenue > 0
                                        ? `${((financeStats.onlineTotal / financeStats.totalRevenue) * 100).toFixed(0)}%`
                                        : '—'}
                                </strong>
                            </li>
                        </ul>
                    )}
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>
                            <Clock size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                            {t('finance.receivablesAging')}
                        </h2>
                        <Link to={flaggedPath} className="finance-card-link">
                            {t('finance.viewAllFlagged')}
                        </Link>
                    </div>

                    {loadingFlagged ? (
                        <div className="chart-placeholder">
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : flaggedCars.length === 0 ? (
                        <div className="chart-placeholder">
                            <p>{t('valet.noFlaggedCars')}</p>
                        </div>
                    ) : (
                        <div className="finance-aging-grid">
                            {AGING_BUCKETS.map((bucket) => (
                                <article key={bucket} className={`finance-aging-card finance-aging-card--${bucket}`}>
                                    <span className="finance-aging-label">
                                        {t(`finance.aging.${bucket}`)}
                                    </span>
                                    <strong className="finance-aging-amount">
                                        {receivablesAging[bucket].amount.toFixed(2)} ETB
                                    </strong>
                                    <span className="finance-aging-count">
                                        {t('finance.agingAccounts', { count: receivablesAging[bucket].count })}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>{t('finance.topFlaggedReceivables')}</h2>
                        <Link to={flaggedPath} className="finance-card-link">
                            {t('finance.viewAllFlagged')}
                        </Link>
                    </div>

                    {loadingFlagged ? (
                        <div className="chart-placeholder">
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : topFlagged.length === 0 ? (
                        <div className="chart-placeholder">
                            <p>{t('valet.noFlaggedCars')}</p>
                        </div>
                    ) : (
                        <div className="finance-flagged-mini-table-wrap">
                            <table className="revenue-table">
                                <thead>
                                    <tr>
                                        <th>{t('valet.licensePlate')}</th>
                                        <th>{t('finance.daysOutstanding')}</th>
                                        <th>{t('valet.parkingFee')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topFlagged.map((car) => (
                                        <tr key={car._id}>
                                            <td>{getLicensePlate(car)}</td>
                                            <td>{getDaysOutstanding(car)}</td>
                                            <td>
                                                {calculateFlaggedFee(car).totalWithVat.toFixed(2)} ETB
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboardOverview;
