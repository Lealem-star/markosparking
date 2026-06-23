import { Car, MoreVertical } from 'lucide-react';
import { canParkIn, formatDateTime } from './parkedCarsUtils';

const ParkedCarsTable = ({
    t,
    loading,
    filteredCars,
    searchQuery,
    serviceFilter,
    parkInLoadingId,
    calculateFee,
    onCheckOut,
    onParkIn,
    onRegisterCar,
}) => (
    <div className="table-card">
        <div className="table-card-header">
            <Car size={20} />
            <h2>{t('valet.parkedCars')}</h2>
        </div>
        <div className="table-card-body">
            {!loading && filteredCars.length > 0 ? (
                <>
                    <div className="mobile-car-list">
                        {filteredCars.map((car) => {
                            const fee = car.status === 'checked_out'
                                ? `${car.totalPaidAmount?.toFixed(2) || '0.00'} ETB`
                                : `${calculateFee(car).totalWithVat.toFixed(2)} ETB`;
                            return (
                                <article key={car._id} className="mobile-car-card">
                                    <div className="mobile-car-card-top">
                                        <span className="plate-badge">{car.licensePlate}</span>
                                        <span className={`status-pill status-pill--${car.status}`}>
                                            <span className="status-dot" />
                                            {car.status === 'checked_out' ? t('valet.checkedOut') : t('valet.parked')}
                                        </span>
                                        <button type="button" className="mobile-car-menu" aria-label={t('valet.actions')}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                    <div className="mobile-car-card-body">
                                        <strong>{car.model || '-'}</strong>
                                        <span className="mobile-car-meta">
                                            {formatDateTime(car.parkedAt)} · {fee}
                                        </span>
                                    </div>
                                    <div className="mobile-car-card-actions">
                                        {car.status === 'parked' ? (
                                            <button type="button" className="btn-action btn-checkout" onClick={() => onCheckOut(car)}>
                                                {t('valet.checkOut')}
                                            </button>
                                        ) : canParkIn(car) ? (
                                            <button
                                                type="button"
                                                className="btn-action btn-park-in"
                                                onClick={() => onParkIn(car)}
                                                disabled={parkInLoadingId === car._id}
                                            >
                                                {parkInLoadingId === car._id ? t('common.loading') : t('valet.parkIn')}
                                            </button>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    <div className="desktop-table-view">
                        <table className="cars-table cars-table--v2">
                            <thead>
                                <tr>
                                    <th>{t('valet.licensePlate')}</th>
                                    <th>{t('valet.vehicle')}</th>
                                    <th>{t('valet.parkedAt')}</th>
                                    <th>{t('valet.checkedOutAt')}</th>
                                    <th>{t('valet.parkingFee')}</th>
                                    <th>{t('valet.status')}</th>
                                    <th>{t('valet.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCars.map((car) => (
                                    <tr key={car._id}>
                                        <td><span className="plate-badge">{car.licensePlate}</span></td>
                                        <td>
                                            <div className="vehicle-info">
                                                <strong>{car.model || '-'}</strong>
                                                {car.color && <span className="color">{car.color}</span>}
                                            </div>
                                        </td>
                                        <td>{formatDateTime(car.parkedAt)}</td>
                                        <td>{car.checkedOutAt ? formatDateTime(car.checkedOutAt) : '-'}</td>
                                        <td className="fee-cell">
                                            {car.status === 'checked_out'
                                                ? `${car.totalPaidAmount?.toFixed(2) || '0.00'} ETB`
                                                : `${calculateFee(car).totalWithVat.toFixed(2)} ETB`}
                                        </td>
                                        <td>
                                            <span className={`status-pill status-pill--${car.status}`}>
                                                <span className="status-dot" />
                                                {car.status === 'checked_out' ? t('valet.checkedOut') : t('valet.parked')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                {car.status === 'parked' ? (
                                                    <button type="button" className="btn-action btn-checkout" onClick={() => onCheckOut(car)}>
                                                        {t('valet.checkOut')}
                                                    </button>
                                                ) : canParkIn(car) ? (
                                                    <button
                                                        type="button"
                                                        className="btn-action btn-park-in"
                                                        onClick={() => onParkIn(car)}
                                                        disabled={parkInLoadingId === car._id}
                                                    >
                                                        {parkInLoadingId === car._id ? t('common.loading') : t('valet.parkIn')}
                                                    </button>
                                                ) : (
                                                    <span className="action-muted">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : !loading ? (
                <div className="no-data">
                    <p>{searchQuery || serviceFilter !== 'all' ? t('valet.noFilterResults') : t('valet.noParkedCars')}</p>
                    <button type="button" className="btn-primary" onClick={onRegisterCar}>
                        {t('valet.registerFirstCar')}
                    </button>
                </div>
            ) : null}
        </div>
    </div>
);

export default ParkedCarsTable;
