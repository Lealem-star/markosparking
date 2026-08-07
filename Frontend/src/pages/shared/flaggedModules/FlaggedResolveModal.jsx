import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { calculateFlaggedFee, getLicensePlate } from './flaggedUtils';

const FlaggedResolveModal = ({
    t,
    isOpen,
    car,
    loading,
    onClose,
    onSubmit,
}) => {
    const [resolutionNote, setResolutionNote] = useState('');
    const [totalPaidAmount, setTotalPaidAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('manual');

    useEffect(() => {
        if (!isOpen || !car) return;
        const fee = calculateFlaggedFee(car);
        setResolutionNote('');
        setTotalPaidAmount(String(fee.totalWithVat.toFixed(2)));
        setPaymentMethod('manual');
    }, [isOpen, car]);

    if (!isOpen || !car) return null;

    const fee = calculateFlaggedFee(car);
    const amountNum = parseFloat(totalPaidAmount);
    const canSubmit = resolutionNote.trim().length >= 3 && !loading;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!canSubmit) return;

        onSubmit({
            carId: car._id,
            resolutionNote: resolutionNote.trim(),
            totalPaidAmount: Number.isFinite(amountNum) ? amountNum : fee.totalWithVat,
            paymentMethod,
        });
    };

    return (
        <div className="flagged-resolve-overlay" role="presentation" onClick={onClose}>
            <div
                className="flagged-resolve-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="flagged-resolve-title"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flagged-resolve-modal__header">
                    <div>
                        <h2 id="flagged-resolve-title">{t('finance.resolveFlaggedTitle')}</h2>
                        <p>{getLicensePlate(car)} · {fee.totalWithVat.toFixed(2)} ETB</p>
                    </div>
                    <button type="button" className="flagged-resolve-close" onClick={onClose} aria-label={t('common.close')}>
                        <X size={20} />
                    </button>
                </header>

                <form className="flagged-resolve-form" onSubmit={handleSubmit}>
                    <label>
                        {t('finance.resolutionNote')}
                        <textarea
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            placeholder={t('finance.resolutionNotePlaceholder')}
                            rows={4}
                            required
                            minLength={3}
                            maxLength={500}
                        />
                    </label>

                    <label>
                        {t('finance.amountCollected')}
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={totalPaidAmount}
                            onChange={(e) => setTotalPaidAmount(e.target.value)}
                        />
                    </label>

                    <label>
                        {t('finance.paymentMethod')}
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="manual">{t('finance.paymentManual')}</option>
                            <option value="online">{t('finance.paymentOnline')}</option>
                        </select>
                    </label>

                    <p className="flagged-resolve-hint">{t('finance.resolveHint')}</p>

                    <div className="flagged-resolve-actions">
                        <button type="button" className="flagged-btn" onClick={onClose} disabled={loading}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="flagged-btn flagged-btn--primary" disabled={!canSubmit}>
                            {loading ? t('common.loading') : t('finance.markResolved')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FlaggedResolveModal;
