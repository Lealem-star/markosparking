import { useTranslation } from 'react-i18next';
import { formatOverviewDateTime } from './valetOverviewUtils';

const ValetOverviewPackageTable = ({
    subscriptions,
    filteredSubscriptions,
    phoneFilter,
    onPhoneFilterChange,
    error,
    onDismissError,
    parkInLoadingId,
    onParkIn,
}) => {
    const { t } = useTranslation();
    const normalizedPhoneFilter = phoneFilter.trim().toLowerCase();

    return (
        <div className="historical-stats-section">
            <div className="package-section-header">
                <h2>Package subscriber</h2>
                <input
                    type="text"
                    className="phone-filter-input"
                    placeholder="Filter by phone number"
                    value={phoneFilter}
                    onChange={(e) => onPhoneFilterChange(e.target.value)}
                    aria-label="Filter package services by phone number"
                />
            </div>

            {error && (
                <div className="package-error-banner" role="alert">
                    {error}
                    <button type="button" onClick={onDismissError} aria-label="Dismiss">×</button>
                </div>
            )}

            {filteredSubscriptions.length > 0 ? (
                <div className="stats-table-container">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>License Plate</th>
                                <th>Phone</th>
                                <th>Package Type</th>
                                <th>End Date</th>
                                <th>Total Visits</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.map((sub) => {
                                const packageType = sub.packageDuration
                                    ? sub.packageDuration.charAt(0).toUpperCase() + sub.packageDuration.slice(1)
                                    : 'N/A';
                                const now = new Date();
                                const isExpired = sub.packageEndDate && sub.packageEndDate <= now;
                                const canParkIn = !sub.isCurrentlyParked && sub.lastCheckedOutRecord && !isExpired;
                                const loading = parkInLoadingId === sub.key;

                                return (
                                    <tr key={sub.key}>
                                        <td>{sub.licensePlate}</td>
                                        <td>{sub.phoneNumber || 'N/A'}</td>
                                        <td>{packageType}</td>
                                        <td>{sub.packageEndDate ? formatOverviewDateTime(sub.packageEndDate) : 'N/A'}</td>
                                        <td>{sub.cars.length}</td>
                                        <td>
                                            <span className={`package-status-badge ${sub.isCurrentlyParked ? 'parked' : 'checked-out'}`}>
                                                {sub.isCurrentlyParked ? t('valet.parked') : t('valet.checkedOut')}
                                            </span>
                                        </td>
                                        <td>
                                            {canParkIn && (
                                                <button
                                                    type="button"
                                                    className="btn-park-in"
                                                    onClick={() => onParkIn(sub)}
                                                    disabled={loading}
                                                >
                                                    {loading ? t('common.loading') : t('valet.parkIn')}
                                                </button>
                                            )}
                                            {isExpired && !sub.isCurrentlyParked && (
                                                <span className="package-expired-label">Expired</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="no-stats-message">
                    <p>
                        {subscriptions.length > 0 && normalizedPhoneFilter
                            ? 'No package service registrations found for this phone number.'
                            : 'No package service registrations available.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ValetOverviewPackageTable;
