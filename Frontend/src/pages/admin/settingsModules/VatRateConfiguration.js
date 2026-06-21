import React from 'react';
import { Edit2, Save, HelpCircle, Clock } from 'lucide-react';

const VatStatusCard = ({
    t,
    vatEnabled,
    onToggle,
    vatRate,
    editingVAT,
    onEditRate,
    loading,
}) => {
    const ratePercent = (vatRate * 100).toFixed(2);

    return (
        <div className="vat-status-card">
            <div className="vat-status-left">
                <span className="vat-status-label">{t('settings.vatStatus')}</span>
                <div className="vat-status-toggle-row">
                    <button
                        type="button"
                        className={`vat-toggle ${vatEnabled ? 'is-on' : ''}`}
                        onClick={() => onToggle(!vatEnabled)}
                        disabled={loading}
                        aria-pressed={vatEnabled}
                        aria-label={t('settings.vatStatus')}
                    >
                        <span className="vat-toggle-thumb" />
                    </button>
                    <span className={`vat-status-text ${vatEnabled ? 'is-enabled' : ''}`}>
                        {vatEnabled ? t('settings.vatEnabled') : t('settings.vatDisabled')}
                    </span>
                </div>
                <p className="vat-status-hint">{t('settings.vatEnabledHint')}</p>
            </div>

            <div className="vat-status-divider" aria-hidden="true" />

            <div className="vat-status-right">
                <span className="vat-status-label">{t('settings.currentVATRate')}</span>
                <div className="vat-current-rate">{ratePercent}%</div>
                <p className="vat-current-sub">
                    ({ratePercent}% {t('settings.vatRateDescription')})
                </p>
            </div>

            {!editingVAT && (
                <button
                    type="button"
                    className="vat-edit-rate-btn"
                    onClick={onEditRate}
                    disabled={loading}
                >
                    <Edit2 size={16} />
                    {t('settings.editRate')}
                </button>
            )}
        </div>
    );
};

const VatUpdatePanel = ({
    t,
    vatInput,
    onChange,
    onSave,
    onCancel,
    loading,
    editingVAT,
}) => (
    <div className="vat-panel vat-panel--update">
        <h3>{t('settings.updateVatRate')}</h3>
        <label className="vat-input-label" htmlFor="vat-rate-input">
            {t('settings.vatRatePercent')}
        </label>
        <div className="vat-rate-input-wrap">
            <input
                id="vat-rate-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={vatInput}
                onChange={(e) => onChange(e.target.value)}
                className="vat-rate-input"
                disabled={!editingVAT || loading}
            />
            <span className="vat-rate-suffix">%</span>
        </div>
        <p className="vat-input-hint">{t('settings.vatRateInputHint')}</p>
        {editingVAT && (
            <div className="vat-panel-actions">
                <button type="button" className="vat-btn vat-btn--ghost" onClick={onCancel} disabled={loading}>
                    {t('common.cancel')}
                </button>
                <button type="button" className="vat-btn vat-btn--primary" onClick={onSave} disabled={loading}>
                    <Save size={16} />
                    {loading ? t('common.loading') : t('settings.saveChanges')}
                </button>
            </div>
        )}
    </div>
);

const VatExamplePanel = ({ t, vatRate }) => {
    const ratePercent = (vatRate * 100).toFixed(2);
    const baseAmount = 100;
    const vatAmount = baseAmount * vatRate;
    const totalAmount = baseAmount + vatAmount;

    return (
        <div className="vat-panel vat-panel--example">
            <h3>{t('settings.exampleCalculation')}</h3>
            <div className="vat-example-rows">
                <div className="vat-example-row">
                    <span>{t('settings.baseAmount')}</span>
                    <span>{baseAmount.toFixed(2)} ETB</span>
                </div>
                <div className="vat-example-row">
                    <span>{t('dashboard.vat')} ({ratePercent}%)</span>
                    <span>{vatAmount.toFixed(2)} ETB</span>
                </div>
                <div className="vat-example-row vat-example-row--total">
                    <span>{t('settings.totalAmount')}</span>
                    <span>{totalAmount.toFixed(2)} ETB</span>
                </div>
            </div>
            <div className="vat-example-note">
                {t('settings.vatExampleNote')}
            </div>
        </div>
    );
};

const VatHistoryTable = ({ t, history }) => {
    const formatDate = (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="vat-history-section">
            <h3>
                <Clock size={18} />
                {t('settings.vatRateHistory')}
            </h3>
            {history.length === 0 ? (
                <p className="vat-history-empty">{t('settings.noVatHistory')}</p>
            ) : (
                <div className="vat-history-table-wrap">
                    <table className="vat-history-table">
                        <thead>
                            <tr>
                                <th>{t('settings.historyRate')}</th>
                                <th>{t('admin.status')}</th>
                                <th>{t('settings.effectiveFrom')}</th>
                                <th>{t('settings.updatedBy')}</th>
                                <th>{t('settings.notes')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((entry, index) => (
                                <tr key={`${entry.effectiveFrom}-${index}`}>
                                    <td className="vat-history-rate">
                                        {(entry.rate * 100).toFixed(2)}%
                                    </td>
                                    <td>
                                        <span className={`vat-history-status vat-history-status--${entry.status}`}>
                                            {entry.status === 'active'
                                                ? t('settings.historyActive')
                                                : t('settings.historyInactive')}
                                        </span>
                                    </td>
                                    <td>{formatDate(entry.effectiveFrom)}</td>
                                    <td>{entry.updatedBy || '—'}</td>
                                    <td>{entry.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const VatRateConfiguration = ({
    t,
    vatRate,
    vatEnabled,
    vatHistory,
    editingVAT,
    vatInput,
    loading,
    success,
    error,
    onToggleEnabled,
    onEditRate,
    onVatInputChange,
    onSave,
    onCancel,
    onShowHelp,
}) => (
    <div className="vat-configuration">
        <div className="vat-page-header">
            <div>
                <h2>{t('settings.vatRateConfiguration')}</h2>
                <p>{t('settings.configureVATRateFull')}</p>
            </div>
            <button type="button" className="vat-help-btn" onClick={onShowHelp}>
                <HelpCircle size={16} />
                {t('settings.help')}
            </button>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <VatStatusCard
            t={t}
            vatEnabled={vatEnabled}
            onToggle={onToggleEnabled}
            vatRate={vatRate}
            editingVAT={editingVAT}
            onEditRate={onEditRate}
            loading={loading}
        />

        <div className="vat-info-banner">
            {t('settings.vatAppliesToNewOnly')}
        </div>

        <div className="vat-panels-grid">
            <VatUpdatePanel
                t={t}
                vatInput={vatInput}
                onChange={onVatInputChange}
                onSave={onSave}
                onCancel={onCancel}
                loading={loading}
                editingVAT={editingVAT}
            />
            <VatExamplePanel t={t} vatRate={vatRate} />
        </div>

        <VatHistoryTable t={t} history={vatHistory} />
    </div>
);

export default VatRateConfiguration;
export { VatStatusCard, VatUpdatePanel, VatExamplePanel, VatHistoryTable };
