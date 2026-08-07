import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Receipt, RefreshCw, Download } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { useTransactionsQuery, useParkZonesQuery } from '../../hooks/queries';
import { getApiError } from '../../api/client';
import { getLicensePlate } from '../../utils/carDisplay';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import { exportTransactionsCsv, fetchAllTransactions } from './financeUtils';
import '../../styles/financePortal.scss';

const PAGE_SIZE = 50;

const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const FinanceTransactions = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [paymentMethod, setPaymentMethod] = useState('all');
    const [zone, setZone] = useState('all');
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');

    const exportFilters = useMemo(
        () => ({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            paymentMethod,
            zone,
        }),
        [startDate, endDate, paymentMethod, zone]
    );

    const filters = useMemo(
        () => ({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            paymentMethod,
            zone,
            page,
            limit: PAGE_SIZE,
        }),
        [startDate, endDate, paymentMethod, zone, page]
    );

    const { data: parkZones = [] } = useParkZonesQuery(user?.token);
    const { data, isLoading, isFetching, error, refetch } = useTransactionsQuery(user?.token, filters);

    const items = data?.items || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    const handleFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setPage(1);
    };

    const handleExport = async () => {
        if (!user?.token || exporting) return;

        setExporting(true);
        setExportError('');
        try {
            const allItems = await fetchAllTransactions(user.token, exportFilters);
            if (allItems.length === 0) return;
            exportTransactionsCsv(allItems, t);
        } catch (err) {
            setExportError(getApiError(err, t('finance.exportFailed')));
        } finally {
            setExporting(false);
        }
    };

    if (isLoading && !data) {
        return <DashboardContentLoader />;
    }

    const errorMessage = error ? getApiError(error, t('finance.transactionsLoadFailed')) : '';
    const loading = isLoading || isFetching || exporting;

    return (
        <div className="finance-transactions-page">
            <header className="finance-transactions-page__header">
                <div>
                    <h1>
                        <Receipt size={24} />
                        {t('finance.transactionsTitle')}
                    </h1>
                    <p>{t('finance.transactionsSubtitle')}</p>
                </div>
                <div className="finance-transactions-page__meta">
                    <span>{t('finance.totalTransactions', { count: total })}</span>
                    <button
                        type="button"
                        className="finance-btn finance-btn--ghost"
                        onClick={handleExport}
                        disabled={loading || total === 0}
                    >
                        <Download size={16} />
                        {exporting ? t('finance.exporting') : t('finance.exportCsv')}
                    </button>
                    <button
                        type="button"
                        className="finance-btn finance-btn--ghost"
                        onClick={() => refetch()}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        {t('common.refresh')}
                    </button>
                </div>
            </header>

            {errorMessage && (
                <div className="finance-alert finance-alert--error">{errorMessage}</div>
            )}

            {exportError && (
                <div className="finance-alert finance-alert--error">{exportError}</div>
            )}

            <div className="finance-transactions-filters">
                <input
                    type="date"
                    value={startDate}
                    onChange={handleFilterChange(setStartDate)}
                    aria-label={t('auditLogs.startDate')}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={handleFilterChange(setEndDate)}
                    aria-label={t('auditLogs.endDate')}
                />
                <select value={paymentMethod} onChange={handleFilterChange(setPaymentMethod)}>
                    <option value="all">{t('finance.allPaymentMethods')}</option>
                    <option value="manual">{t('finance.paymentManual')}</option>
                    <option value="online">{t('finance.paymentOnline')}</option>
                </select>
                <select value={zone} onChange={handleFilterChange(setZone)}>
                    <option value="all">{t('admin.allZones')}</option>
                    {parkZones.map((z) => (
                        <option key={z._id || z.code} value={z.code}>
                            {z.code}
                        </option>
                    ))}
                </select>
            </div>

            <div className="finance-transactions-table-wrap">
                <table className="finance-transactions-table">
                    <thead>
                        <tr>
                            <th>{t('finance.checkoutTime')}</th>
                            <th>{t('valet.licensePlate')}</th>
                            <th>{t('admin.zone')}</th>
                            <th>{t('finance.amount')}</th>
                            <th>{t('dashboard.vat')}</th>
                            <th>{t('finance.paymentMethod')}</th>
                            <th>{t('dashboard.valetOfficerName')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="finance-transactions-empty">
                                    {t('finance.noTransactions')}
                                </td>
                            </tr>
                        ) : (
                            items.map((car) => {
                                const valet = car.valet_id || {};
                                const method = car.paymentMethod === 'online' ? 'online' : 'manual';

                                return (
                                    <tr key={car._id}>
                                        <td>{formatDateTime(car.checkedOutAt)}</td>
                                        <td className="finance-plate">{getLicensePlate(car)}</td>
                                        <td>{car.location || '—'}</td>
                                        <td>{(car.totalPaidAmount || 0).toFixed(2)} ETB</td>
                                        <td>{(car.vatAmount || 0).toFixed(2)} ETB</td>
                                        <td>
                                            <span className={`finance-payment-pill finance-payment-pill--${method}`}>
                                                {method === 'online'
                                                    ? t('finance.paymentOnline')
                                                    : t('finance.paymentManual')}
                                            </span>
                                        </td>
                                        <td>{valet.name || '—'}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="finance-pagination">
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        <ChevronLeft size={18} />
                        {t('auditLogs.previous')}
                    </button>
                    <span>{t('auditLogs.pageInfo', { page, totalPages })}</span>
                    <button
                        type="button"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                        {t('auditLogs.next')}
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FinanceTransactions;
