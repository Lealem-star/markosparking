import React from 'react';
import { Search, Plus, ChevronDown } from 'lucide-react';

const StaffFilterBar = ({
    t,
    searchQuery,
    onSearchChange,
    roleFilter,
    onRoleChange,
    zoneFilter,
    onZoneChange,
    statusFilter,
    onStatusChange,
    zones,
    canCreateUsers,
    onAddStaff,
}) => (
    <div className="staff-filter-bar">
        <div className="staff-search-wrap">
            <Search size={18} className="staff-search-icon" aria-hidden="true" />
            <input
                type="search"
                className="staff-search-input"
                placeholder={t('admin.searchStaffPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

        <div className="staff-filter-select-wrap">
            <select
                className="staff-filter-select"
                value={roleFilter}
                onChange={(e) => onRoleChange(e.target.value)}
                aria-label={t('admin.userType')}
            >
                <option value="all">{t('admin.allRoles')}</option>
                <option value="system_admin">{t('admin.systemAdmin')}</option>
                <option value="director">{t('admin.director')}</option>
                <option value="supervisor">{t('admin.supervisor')}</option>
                <option value="finance_officer">{t('admin.financeOfficer')}</option>
                <option value="valet">{t('admin.valet')}</option>
            </select>
            <ChevronDown size={16} className="staff-filter-chevron" aria-hidden="true" />
        </div>

        <div className="staff-filter-select-wrap">
            <select
                className="staff-filter-select"
                value={zoneFilter}
                onChange={(e) => onZoneChange(e.target.value)}
                aria-label={t('admin.zone')}
            >
                <option value="all">{t('admin.allZones')}</option>
                <option value="all_zones">{t('admin.allZonesLabel')}</option>
                {zones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                ))}
            </select>
            <ChevronDown size={16} className="staff-filter-chevron" aria-hidden="true" />
        </div>

        <div className="staff-filter-select-wrap">
            <select
                className="staff-filter-select"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                aria-label={t('admin.status')}
            >
                <option value="all">{t('admin.allStatus')}</option>
                <option value="active">{t('admin.active')}</option>
                <option value="inactive">{t('admin.inactive')}</option>
            </select>
            <ChevronDown size={16} className="staff-filter-chevron" aria-hidden="true" />
        </div>

        {canCreateUsers && (
            <button type="button" className="staff-add-btn" onClick={onAddStaff}>
                <Plus size={18} />
                {t('admin.addUser')}
            </button>
        )}
    </div>
);

export default StaffFilterBar;
