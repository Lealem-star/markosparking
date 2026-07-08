import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ALL_ZONES_CODE,
    ROLES,
    canCreateRole,
    requiresZoneCode,
    isAllZonesCode,
    serializeSupervisorZones,
    getSupervisorZoneList,
} from '../../../constants/roles';
import {
    getRoleLabel,
    buildValetZoneOptions,
    buildSupervisorZoneOptions,
    resolveParkZoneCode,
    getPriceLevelForParkZone,
} from './staffUtils';

const UserFormModal = ({
    isOpen,
    title,
    formData,
    parkZones = [],
    zones = [],
    error,
    actorType,
    onClose,
    onChange,
    onSubmit,
    submitLabel,
    cancelLabel,
    isPasswordRequired = true,
}) => {
    const { t } = useTranslation();
    const creatableRoles = useMemo(() => {
        const allRoles = ['director', 'supervisor', 'finance_officer', 'valet'];
        const allowed = allRoles.filter((role) => canCreateRole(actorType, role));
        if (formData.type && !allowed.includes(formData.type)) {
            return [formData.type, ...allowed];
        }
        return allowed;
    }, [actorType, formData.type]);

    const valetZoneOptions = useMemo(
        () => buildValetZoneOptions(parkZones),
        [parkZones]
    );

    const supervisorZoneOptions = useMemo(
        () => buildSupervisorZoneOptions(parkZones, zones, formData.parkZoneCode),
        [parkZones, zones, formData.parkZoneCode]
    );

    const selectedValetZoneCode = resolveParkZoneCode(formData.parkZoneCode, parkZones);
    const selectedZonePriceLevel = getPriceLevelForParkZone(selectedValetZoneCode, parkZones);

    const allZonesSelected = isAllZonesCode(formData.parkZoneCode);

    const handleToggleAllZones = (checked) => {
        onChange('parkZoneCode', checked ? ALL_ZONES_CODE : '');
    };

    const handleToggleSupervisorZone = (zoneCode, checked) => {
        const current = getSupervisorZoneList(formData.parkZoneCode).filter(
            (existing) => existing.toUpperCase() !== zoneCode.toUpperCase()
        );
        if (checked) {
            current.push(zoneCode);
        }
        onChange('parkZoneCode', serializeSupervisorZones(current));
    };

    const isSupervisorZoneSelected = (zoneCode) =>
        getSupervisorZoneList(formData.parkZoneCode).some(
            (selected) => selected.toUpperCase() === zoneCode.toUpperCase()
        );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder="Enter name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            value={formData.phoneNumber}
                            onChange={(e) => onChange('phoneNumber', e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>
                    <div className="form-group">
                        <label>{isPasswordRequired ? 'Password' : 'Password (Optional)'}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => onChange('password', e.target.value)}
                            placeholder={isPasswordRequired ? 'Enter password' : 'Leave empty to keep current password'}
                        />
                        <small>
                            {isPasswordRequired
                                ? 'Must contain uppercase, lowercase, digit, and special character'
                                : 'Leave empty to keep current password. If provided, must contain uppercase, lowercase, digit, and special character'}
                        </small>
                    </div>
                    <div className="form-group">
                        <label>User Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => onChange('type', e.target.value)}
                        >
                            <option value="">Select type</option>
                            {creatableRoles.map((role) => (
                                <option key={role} value={role}>
                                    {getRoleLabel(role, t)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {requiresZoneCode(formData.type) && (
                        <div className="form-group">
                            <label>{t('admin.parkZoneCode')} *</label>
                            {formData.type === ROLES.SUPERVISOR ? (
                                <div className="supervisor-zone-picker">
                                    <label className="supervisor-zone-option supervisor-zone-option--all">
                                        <input
                                            type="checkbox"
                                            checked={allZonesSelected}
                                            onChange={(e) => handleToggleAllZones(e.target.checked)}
                                        />
                                        <span>
                                            {t('admin.allZonesLabel')} ({ALL_ZONES_CODE})
                                        </span>
                                    </label>
                                    {!allZonesSelected && (
                                        <div className="supervisor-zone-list">
                                            {supervisorZoneOptions.length === 0 ? (
                                                <p className="supervisor-zone-empty">{t('admin.noZonesAvailable')}</p>
                                            ) : (
                                                supervisorZoneOptions.map((zone) => (
                                                    <label key={zone.code} className="supervisor-zone-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSupervisorZoneSelected(zone.code)}
                                                            onChange={(e) => handleToggleSupervisorZone(zone.code, e.target.checked)}
                                                        />
                                                        <span>
                                                            {zone.legacy
                                                                ? `${zone.code} (${t('admin.legacyParkZone')})`
                                                                : `${zone.code} — ${zone.name}`}
                                                        </span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : formData.type === ROLES.VALET ? (
                                <>
                                    <select
                                        value={selectedValetZoneCode}
                                        onChange={(e) => onChange('parkZoneCode', e.target.value)}
                                        required
                                        disabled={valetZoneOptions.length === 0}
                                    >
                                        <option value="">{t('admin.selectParkZone')}</option>
                                        {valetZoneOptions.map((zone) => (
                                            <option key={zone.code} value={zone.code}>
                                                {zone.priceLevel
                                                    ? `${zone.name} (${zone.priceLevel})`
                                                    : zone.name}
                                            </option>
                                        ))}
                                    </select>
                                    {valetZoneOptions.length === 0 && (
                                        <small className="form-warning">{t('admin.noParkingZonesConfigured')}</small>
                                    )}
                                    {selectedValetZoneCode && selectedZonePriceLevel && (
                                        <small>{t('admin.valetPriceLevelFromZone', { priceLevel: selectedZonePriceLevel })}</small>
                                    )}
                                    {selectedValetZoneCode && !selectedZonePriceLevel && (
                                        <small className="form-warning">{t('admin.zoneMissingPriceLevel')}</small>
                                    )}
                                </>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.parkZoneCode}
                                    onChange={(e) => onChange('parkZoneCode', e.target.value)}
                                    placeholder={t('admin.parkZonePlaceholder')}
                                    required
                                />
                            )}
                            {formData.type === ROLES.SUPERVISOR && (
                                <small>{t('admin.supervisorZoneHint')}</small>
                            )}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>{cancelLabel}</button>
                    <button type="button" className="btn-submit" onClick={onSubmit}>{submitLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default UserFormModal;
