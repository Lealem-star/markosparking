import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Star, Shield, Car, UserCog } from 'lucide-react';
import { getInitials, getRoleLabel, getRoleSubtitle, getZoneLabel } from './staffUtils';

const RoleBadge = ({ type, t }) => {
    const icons = {
        system_admin: Star,
        manager: Shield,
        admin: UserCog,
        valet: Car,
    };
    const Icon = icons[type] || UserCog;

    return (
        <span className={`staff-role-badge staff-role-badge--${type}`}>
            <Icon size={12} />
            {getRoleLabel(type, t)}
        </span>
    );
};

const StaffActionsMenu = ({ onEdit, onDelete, t }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="staff-actions-menu" ref={menuRef}>
            <button
                type="button"
                className="staff-actions-trigger"
                onClick={() => setOpen((prev) => !prev)}
                aria-label={t('settings.actions')}
            >
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="staff-actions-dropdown">
                    <button type="button" onClick={() => { setOpen(false); onEdit(); }}>
                        <Edit size={14} />
                        {t('common.edit')}
                    </button>
                    <button type="button" className="danger" onClick={() => { setOpen(false); onDelete(); }}>
                        <Trash2 size={14} />
                        {t('common.delete')}
                    </button>
                </div>
            )}
        </div>
    );
};

const StaffTable = ({ staffList, startIndex = 0, t, onEdit, onDelete, emptyMessage }) => {
    if (staffList.length === 0) {
        return (
            <div className="staff-empty-message">
                <em>{emptyMessage}</em>
            </div>
        );
    }

    return (
        <div className="staff-table-wrap">
            <table className="staff-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{t('profile.name')}</th>
                        <th>{t('auth.phoneNumber')}</th>
                        <th>{t('admin.userType')}</th>
                        <th>{t('admin.zone')}</th>
                        <th>{t('admin.status')}</th>
                        <th>{t('settings.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {staffList.map((item, index) => (
                        <tr key={item._id || index}>
                            <td>{startIndex + index + 1}</td>
                            <td>
                                <div className="staff-name-cell">
                                    <span className={`staff-avatar staff-avatar--${item.type}`}>
                                        {getInitials(item?.name)}
                                    </span>
                                    <span className="staff-name-meta">
                                        <strong>{item?.name}</strong>
                                        <small>{getRoleSubtitle(item?.type, t)}</small>
                                    </span>
                                </div>
                            </td>
                            <td>{item?.phoneNumber}</td>
                            <td>
                                <RoleBadge type={item?.type} t={t} />
                            </td>
                            <td>{getZoneLabel(item, t)}</td>
                            <td>
                                <span className="staff-status-pill">
                                    <span className="staff-status-dot" />
                                    {t('admin.active')}
                                </span>
                            </td>
                            <td>
                                <StaffActionsMenu
                                    t={t}
                                    onEdit={() => onEdit(item)}
                                    onDelete={() => onDelete(item)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StaffTable;
