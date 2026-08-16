export const RegisterCarServiceModal = ({ t, isOpen, onClose, onSelectService }) => {
    if (!isOpen) return null;

    return (
        <div className="register-car-modal-overlay" onClick={onClose}>
            <div className="register-car-modal" onClick={(e) => e.stopPropagation()}>
                <div className="register-car-modal__header">
                    <h3>{t('valet.selectServiceType')}</h3>
                    <p>{t('valet.selectServiceType')}</p>
                </div>
                <div className="register-car-modal__body">
                    <div className="register-car-modal__service-actions">
                        <button
                            type="button"
                            className="btn-register-choice hourly"
                            onClick={() => onSelectService('hourly')}
                        >
                            {t('valet.hourly')} {t('valet.serviceType')}
                        </button>
                        <button
                            type="button"
                            className="btn-register-choice package"
                            onClick={() => onSelectService('package')}
                        >
                            {t('valet.package')} {t('valet.serviceType')}
                        </button>
                    </div>
                </div>
                <div className="register-car-modal__footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const RegisterCarPackageModal = ({ t, isOpen, onClose, onBack, onSelectDuration }) => {
    if (!isOpen) return null;

    return (
        <div className="register-car-modal-overlay" onClick={onClose}>
            <div className="register-car-modal" onClick={(e) => e.stopPropagation()}>
                <div className="register-car-modal__header">
                    <h3>{t('valet.selectPackageDuration', { defaultValue: 'Select Package Duration' })}</h3>
                    <p>
                        {t('valet.selectPackageDurationHint', {
                            defaultValue: 'Choose the package duration for this vehicle',
                        })}
                    </p>
                </div>
                <div className="register-car-modal__body">
                    <div className="register-car-modal__package-actions">
                        {['weekly', 'monthly', 'yearly'].map((duration) => (
                            <button
                                key={duration}
                                type="button"
                                className={`btn-register-package ${duration}`}
                                onClick={() => onSelectDuration(duration)}
                            >
                                {t(`valet.package_${duration}`, {
                                    defaultValue: duration.charAt(0).toUpperCase() + duration.slice(1),
                                })}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="register-car-modal__footer">
                    <button type="button" className="btn-cancel" onClick={onBack}>
                        {t('common.back', { defaultValue: 'Back' })}
                    </button>
                </div>
            </div>
        </div>
    );
};
