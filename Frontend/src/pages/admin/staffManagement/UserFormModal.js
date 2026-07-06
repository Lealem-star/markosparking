import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ALL_ZONES_CODE,
    ROLES,
    canCreateRole,
    requiresZoneCode,
    requiresPriceLevel,
    isAllZonesCode,
    parseSupervisorZones,
    serializeSupervisorZones,
    getSupervisorZoneList,
} from '../../../constants/roles';
import { getRoleLabel } from './staffUtils';

const UserFormModal = ({
    isOpen,
    title,
    formData,
    priceLevels,
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

    const selectedSupervisorZones = useMemo(
        () => parseSupervisorZones(formData.parkZoneCode),
        [formData.parkZoneCode]
    );

    const zoneOptions = useMemo(() => {
        const optionSet = new Set(zones);
        getSupervisorZoneList(formData.parkZoneCode).forEach((zone) => optionSet.add(zone));
        return Array.from(optionSet).sort();
    }, [zones, formData.parkZoneCode]);

    const allZonesSelected = isAllZonesCode(formData.parkZoneCode);

    const handleToggleAllZones = (checked) => {
        onChange('parkZoneCode', checked ? ALL_ZONES_CODE : '');
    };

    const handleToggleSupervisorZone = (zone, checked) => {
        const current = new Set(getSupervisorZoneList(formData.parkZoneCode));
        if (checked) {
            current.add(zone);
        } else {
            current.delete(zone);
        }
        onChange('parkZoneCode', serializeSupervisorZones([...current]));
    };

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
                                            {zoneOptions.length === 0 ? (
                                                <p className="supervisor-zone-empty">{t('admin.noZonesAvailable')}</p>
                                            ) : (
                                                zoneOptions.map((zone) => (
                                                    <label key={zone} className="supervisor-zone-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSupervisorZones.includes(zone)}
                                                            onChange={(e) => handleToggleSupervisorZone(zone, e.target.checked)}
                                                        />
                                                        <span>{zone}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
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
                    {requiresPriceLevel(formData.type) && (
                        <div className="form-group">
                            <label>Price Level *</label>
                            <select
                                value={formData.priceLevel}
                                onChange={(e) => onChange('priceLevel', e.target.value)}
                                required
                            >
                                <option value="">Select Price Level</option>
                                {priceLevels.map((levelName) => (
                                    <option key={levelName} value={levelName}>{levelName}</option>
                                ))}
                            </select>
                            {priceLevels.length === 0 && (
                                <small className="form-warning">
                                    No price levels available. Please create price levels in Settings first.
                                </small>
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
