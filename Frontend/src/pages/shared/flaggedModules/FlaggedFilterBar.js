import React from 'react';
import { Search, ChevronDown, Download } from 'lucide-react';

const FlaggedFilterBar = ({
    t,
    searchQuery,
    onSearchChange,
    zoneFilter,
    onZoneChange,
    statusFilter,
    onStatusChange,
    zones,
    onExport,
    loading,
}) => (
    <div className="flagged-filter-bar">
        <div className="flagged-search-wrap">
            <Search size={18} className="flagged-search-icon" aria-hidden="true" />
            <input
                type="search"
                className="flagged-search-input"
                placeholder={t('valet.searchFlaggedPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

        <div className="flagged-filter-select-wrap">
            <select
                className="flagged-filter-select"
                value={zoneFilter}
                onChange={(e) => onZoneChange(e.target.value)}
            >
                <option value="all">{t('settings.allZones')}</option>
                {zones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                ))}
            </select>
            <ChevronDown size={16} className="flagged-filter-chevron" aria-hidden="true" />
        </div>

        <div className="flagged-filter-select-wrap">
            <select
                className="flagged-filter-select"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
            >
                <option value="all">{t('valet.allStatus')}</option>
                <option value="unpaid">{t('valet.statusUnpaid')}</option>
                <option value="notified">{t('valet.statusNotified')}</option>
            </select>
            <ChevronDown size={16} className="flagged-filter-chevron" aria-hidden="true" />
        </div>

        <button
            type="button"
            className="flagged-btn flagged-btn--export"
            onClick={onExport}
            disabled={loading}
        >
            <Download size={16} />
            {t('common.export')}
        </button>
    </div>
);

export default FlaggedFilterBar;
