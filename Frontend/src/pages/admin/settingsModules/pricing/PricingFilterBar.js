import React from 'react';
import { Search, ChevronDown, List, LayoutGrid } from 'lucide-react';

const PricingFilterBar = ({
    t,
    searchQuery,
    onSearchChange,
    zoneFilter,
    onZoneChange,
    priceLevelFilter,
    onPriceLevelChange,
    zones,
    priceLevels,
    viewMode,
    onViewModeChange,
}) => (
    <div className="pricing-filter-bar">
        <div className="pricing-search-wrap">
            <Search size={18} className="pricing-search-icon" aria-hidden="true" />
            <input
                type="search"
                className="pricing-search-input"
                placeholder={t('settings.searchPricingPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

        <div className="pricing-filter-select-wrap">
            <select
                className="pricing-filter-select"
                value={zoneFilter}
                onChange={(e) => onZoneChange(e.target.value)}
            >
                <option value="all">{t('settings.allZones')}</option>
                {zones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                ))}
            </select>
            <ChevronDown size={16} className="pricing-filter-chevron" aria-hidden="true" />
        </div>

        <div className="pricing-filter-select-wrap">
            <select
                className="pricing-filter-select"
                value={priceLevelFilter}
                onChange={(e) => onPriceLevelChange(e.target.value)}
            >
                <option value="all">{t('settings.allPriceLevels')}</option>
                {priceLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                ))}
            </select>
            <ChevronDown size={16} className="pricing-filter-chevron" aria-hidden="true" />
        </div>

        <div className="pricing-view-toggle">
            <button
                type="button"
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => onViewModeChange('list')}
                aria-label={t('settings.listView')}
            >
                <List size={18} />
            </button>
            <button
                type="button"
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => onViewModeChange('grid')}
                aria-label={t('settings.gridView')}
            >
                <LayoutGrid size={18} />
            </button>
        </div>
    </div>
);

export default PricingFilterBar;
