import { CAR_TYPES, REGIONS } from './registerCarUtils';

const RegisterCarForm = ({
    t,
    formData,
    plateCodes,
    loading,
    onChange,
    onSubmit,
    onCancel,
}) => (
    <form onSubmit={onSubmit}>
        <div className="form-row">
            <div className="form-group">
                <label>{t('valet.plateCode')} *</label>
                <select
                    value={formData.plateCode}
                    onChange={(e) => onChange('plateCode', e.target.value)}
                    required
                >
                    <option value="" disabled>{t('auth.select')} {t('valet.plateCode')}</option>
                    {plateCodes.map((code) => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>{t('valet.region')} *</label>
                <select
                    value={formData.region}
                    onChange={(e) => onChange('region', e.target.value)}
                    required
                >
                    <option value="" disabled>{t('auth.select')} {t('valet.region')}</option>
                    {REGIONS.map((regionCode) => (
                        <option key={regionCode} value={regionCode}>{regionCode}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>{t('valet.licensePlateNumber')} *</label>
                <input
                    type="text"
                    value={formData.licensePlateNumber}
                    onChange={(e) => onChange('licensePlateNumber', e.target.value.toUpperCase())}
                    placeholder="A12345"
                    required
                />
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>{t('valet.carType')} *</label>
                <select
                    value={formData.carType}
                    onChange={(e) => onChange('carType', e.target.value)}
                    required
                >
                    <option value="" disabled>{t('auth.select')} {t('valet.carType')}</option>
                    {CAR_TYPES.map((type) => (
                        <option key={type} value={type}>{t(`valet.carType_${type}`)}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>{t('valet.phoneNumber')} *</label>
                <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => onChange('phoneNumber', e.target.value)}
                    placeholder="e.g., 2519XXXXXXXX or 09XXXXXXXX"
                    required
                />
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>{t('valet.model')}</label>
                <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => onChange('model', e.target.value)}
                    placeholder="Camry, Civic, etc."
                />
            </div>

            <div className="form-group">
                <label>{t('valet.color')}</label>
                <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => onChange('color', e.target.value)}
                    placeholder="Red, Blue, Black, etc."
                />
            </div>
        </div>

        <div className="form-group">
            <label>{t('valet.notes')} ({t('common.optional')})</label>
            <textarea
                value={formData.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                placeholder="Additional notes about the vehicle..."
                rows="3"
            />
        </div>

        <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
                {t('common.cancel')}
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? t('common.loading') : t('valet.registerCar')}
            </button>
        </div>
    </form>
);

export default RegisterCarForm;
