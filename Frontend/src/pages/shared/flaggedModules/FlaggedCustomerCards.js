import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Bell, MoreVertical, Phone, Calendar } from 'lucide-react';
import {
    calculateFlaggedFee,
    formatFlaggedDateTime,
    getLicensePlate,
} from './flaggedUtils';

const FlaggedCustomerCards = ({
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
        <div className="flagged-mobile-cards">
            {cars.map((car) => {
                const fee = calculateFlaggedFee(car);
                const isNotified = car.notificationSent;
                const displayDate = car.checkedOutAt || car.parkedAt;

                return (
                    <article key={car._id} className="flagged-customer-card">
                        <div className="flagged-customer-card-top">
                            <span className="flagged-plate">{getLicensePlate(car)}</span>
                            <span className="flagged-fee">{fee.totalWithVat.toFixed(2)} ETB</span>
                        </div>

                        <div className="flagged-customer-card-meta">
                            <span className="flagged-customer-meta-item">
                                <Phone size={14} aria-hidden="true" />
                                {car.phoneNumber || 'N/A'}
                            </span>
                            <span className="flagged-customer-meta-item">
                                <Calendar size={14} aria-hidden="true" />
                                {formatFlaggedDateTime(displayDate)}
                            </span>
                        </div>

                        <div className="flagged-customer-card-footer">
                            <span className={`flagged-status-pill ${isNotified ? 'is-notified' : 'is-unpaid'}`}>
                                {isNotified ? t('valet.statusNotified') : t('valet.statusUnpaid')}
                            </span>

                            <div className="flagged-customer-card-actions">
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
                                <div
                                    className="flagged-menu-wrap"
                                    ref={openMenuId === car._id ? menuRef : null}
                                >
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
                        </div>
                    </article>
                );
            })}
        </div>
    );
};

export default FlaggedCustomerCards;
