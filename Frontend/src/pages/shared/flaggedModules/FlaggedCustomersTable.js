import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Bell, MoreVertical } from 'lucide-react';
import {
    calculateFlaggedFee,
    formatFlaggedDateTime,
    getLicensePlate,
} from './flaggedUtils';

import FlaggedCustomerCards from './FlaggedCustomerCards';

const FlaggedCustomersTable = ({
    t,
    cars,
    loading,
    onPayNow,
    onNotify,
}) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopyPhone = async (phone) => {
        if (!phone) return;
        try {
            await navigator.clipboard.writeText(phone);
        } catch {
            // clipboard unavailable
        }
        setOpenMenuId(null);
    };

    return (
        <>
            <FlaggedCustomerCards
                t={t}
                cars={cars}
                loading={loading}
                onPayNow={onPayNow}
                onNotify={onNotify}
            />
            <div className="flagged-table-wrap flagged-table-wrap--desktop">
            <table className="flagged-table">
                <thead>
                    <tr>
                        <th>{t('valet.licensePlate')}</th>
                        <th>{t('valet.phoneNumber')}</th>
                        <th>{t('valet.parkedAt')}</th>
                        <th>{t('valet.checkedOutAt')}</th>
                        <th>{t('valet.parkingFee')}</th>
                        <th>{t('valet.status')}</th>
                        <th>{t('valet.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {cars.map((car) => {
                        const fee = calculateFlaggedFee(car);
                        const isNotified = car.notificationSent;

                        return (
                            <tr key={car._id}>
                                <td className="flagged-plate">{getLicensePlate(car)}</td>
                                <td>{car.phoneNumber || 'N/A'}</td>
                                <td>{formatFlaggedDateTime(car.parkedAt)}</td>
                                <td>{formatFlaggedDateTime(car.checkedOutAt)}</td>
                                <td>
                                    <span className="flagged-fee">{fee.totalWithVat.toFixed(2)} ETB</span>
                                </td>
                                <td>
                                    <span className={`flagged-status-pill ${isNotified ? 'is-notified' : 'is-unpaid'}`}>
                                        {isNotified ? t('valet.statusNotified') : t('valet.statusUnpaid')}
                                    </span>
                                </td>
                                <td>
                                    <div className="flagged-row-actions">
                                        <button
                                            type="button"
                                            className="flagged-action-btn flagged-action-btn--pay"
                                            onClick={() => onPayNow(car)}
                                            disabled={loading}
                                        >
                                            <CreditCard size={14} />
                                            {t('valet.payNow')}
                                        </button>
                                        <button
                                            type="button"
                                            className="flagged-action-btn flagged-action-btn--notify"
                                            onClick={() => onNotify(car)}
                                            disabled={loading || isNotified}
                                        >
                                            <Bell size={14} />
                                            {isNotified ? t('valet.notified') : t('valet.notify')}
                                        </button>
                                        <div className="flagged-menu-wrap" ref={openMenuId === car._id ? menuRef : null}>
                                            <button
                                                type="button"
                                                className="flagged-action-btn flagged-action-btn--more"
                                                onClick={() => setOpenMenuId(openMenuId === car._id ? null : car._id)}
                                                aria-label={t('valet.moreActions')}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {openMenuId === car._id && (
                                                <div className="flagged-menu">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyPhone(car.phoneNumber)}
                                                    >
                                                        {t('valet.copyPhone')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
        </>
    );
};

export default FlaggedCustomersTable;
