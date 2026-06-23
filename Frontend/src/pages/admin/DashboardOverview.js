import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../hooks/useAuth';
import { useParkedCarsQuery } from '../../hooks/queries';
import { getApiError } from '../../api/client';
import { Car, DollarSign } from 'lucide-react';
import { EthiopianDatePicker } from '../../components';
import '../../styles/dashboardOverview.scss';

const StatSparkline = ({ color }) => (
    <svg className="dashboard-stat-sparkline" viewBox="0 0 80 40" aria-hidden="true">
        <polyline
            points="0,32 12,28 24,30 36,22 48,24 60,16 72,18 80,10"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DashboardOverview = () => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const user = useCurrentUser();

    const {
        data: cars = [],
        isLoading: loadingRevenue,
        error: revenueQueryError,
    } = useParkedCarsQuery(user?.token, { date: selectedDate });

    const revenueError = revenueQueryError
        ? getApiError(revenueQueryError, 'Failed to load revenue data')
        : '';

    const { revenueRows, totalDailyCars, totalDailyRevenue } = useMemo(() => {
        const map = new Map();
        let totalRevenue = 0;

        cars.forEach((car) => {
            const valet = car.valet_id || {};
            const key = `${car.location || 'Unknown'}||${valet._id || 'unknown'}`;

            if (!map.has(key)) {
                map.set(key, {
                    parkZoneCode: car.location || 'Unknown',
                    valetName: valet.name || 'Unknown',
                    totalCars: 0,
                    totalRevenue: 0,
                    totalVAT: 0,
                });
            }

            const entry = map.get(key);
            entry.totalCars += 1;

            const revenue = car.totalPaidAmount || 0;
            const vat = car.vatAmount || 0;
            entry.totalRevenue += revenue;
            entry.totalVAT += vat;
            totalRevenue += revenue;
        });

        const rows = Array.from(map.values());

        return {
            revenueRows: rows,
            totalDailyCars: rows.reduce((sum, row) => sum + row.totalCars, 0),
            totalDailyRevenue: totalRevenue,
        };
    }, [cars]);

    return (
        <div className="dashboard-overview">

            <div className="stats-grid">
                <article className="stat-card stat-card--cars">
                    <div className="stat-card-body">
                        <div className="stat-icon">
                            <Car size={20} />
                        </div>
                        <div className="stat-value">{totalDailyCars}</div>
                        <div className="stat-label">{t('dashboard.totalDailyCars')}</div>
                    </div>
                    <div className="stat-sparkline-wrap">
                        <StatSparkline color="#8a70f1" />
                    </div>
                    <div className="stat-card-glow" aria-hidden="true" />
                </article>

                <article className="stat-card stat-card--revenue">
                    <div className="stat-card-body">
                        <div className="stat-icon">
                            <DollarSign size={20} />
                        </div>
                        <div className="stat-value">{totalDailyRevenue.toFixed(2)}</div>
                        <div className="stat-label">{t('dashboard.totalDailyRevenue')}</div>
                    </div>
                    <div className="stat-sparkline-wrap">
                        <StatSparkline color="#2ecc71" />
                    </div>
                    <div className="stat-card-glow" aria-hidden="true" />
                </article>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>{t('dashboard.dailyRevenueByValet')}</h2>
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
                    ) : revenueRows.length === 0 ? (
                        <div className="chart-placeholder">
                            <p>{t('dashboard.noRevenueData')}</p>
                        </div>
                    ) : (
                        <div className="revenue-table-wrapper">
                            <table className="revenue-table">
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
                                    {revenueRows.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.parkZoneCode}</td>
                                            <td>{row.valetName}</td>
                                            <td>{row.totalCars}</td>
                                            <td>{row.totalRevenue.toFixed(2)} ETB</td>
                                            <td>{row.totalVAT.toFixed(2)} ETB</td>
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

export default DashboardOverview;
