import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { canCreateRole, requiresZoneCode, requiresPriceLevel } from '../../../constants/roles';
import { getRoleLabel } from './staffUtils';

const UserFormModal = ({
    isOpen,
    title,
    formData,
    priceLevels,
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
                            <label>Park Zone Code *</label>
                            <input
                                type="text"
                                value={formData.parkZoneCode}
                                onChange={(e) => onChange('parkZoneCode', e.target.value)}
                                placeholder="Enter park zone code"
                                required
                            />
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
