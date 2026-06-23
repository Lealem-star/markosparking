const SettingsSectionToggle = ({ t, activeSection, loading, onChange }) => (
    <div className="settings-toggle">
        <button
            type="button"
            className={`toggle-btn ${activeSection === 'pricing' ? 'active' : ''}`}
            onClick={() => onChange('pricing')}
            disabled={loading}
        >
            {t('settings.carTypePricingConfiguration')}
        </button>
        <button
            type="button"
            className={`toggle-btn ${activeSection === 'vat' ? 'active' : ''}`}
            onClick={() => onChange('vat')}
            disabled={loading}
        >
            {t('settings.vatRateConfiguration')}
        </button>
    </div>
);

export default SettingsSectionToggle;
