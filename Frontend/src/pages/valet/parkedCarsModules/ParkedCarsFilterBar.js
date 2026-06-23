import { Clock, Package, Search, X } from 'lucide-react';
import { EthiopianDatePicker } from '../../../components';

const ParkedCarsFilterBar = ({
    t,
    filter,
    serviceFilter,
    searchQuery,
    selectedDate,
    filteredCount,
    totalCount,
    onFilterChange,
    onServiceFilterChange,
    onSearchChange,
    onDateChange,
}) => (
    <div className="control-panel">
        <div className="control-panel-top">
            <div className="segment-filters">
                <div className="segment-group">
                    <span className="segment-label">{t('valet.status')}</span>
                    <div className="segment-buttons">
                        <button type="button" className={`segment-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>{t('valet.all')}</button>
                        <button type="button" className={`segment-btn ${filter === 'parked' ? 'active' : ''}`} onClick={() => onFilterChange('parked')}>
                            <span className="status-dot status-dot--parked" />{t('valet.parked')}
                        </button>
                        <button type="button" className={`segment-btn ${filter === 'checked_out' ? 'active' : ''}`} onClick={() => onFilterChange('checked_out')}>
                            <span className="status-dot status-dot--checked" />{t('valet.checkedOut')}
                        </button>
                    </div>
                </div>
                <div className="segment-group">
                    <span className="segment-label">{t('valet.serviceType')}</span>
                    <div className="segment-buttons">
                        <button type="button" className={`segment-btn ${serviceFilter === 'all' ? 'active' : ''}`} onClick={() => onServiceFilterChange('all')}>{t('valet.all')}</button>
                        <button type="button" className={`segment-btn ${serviceFilter === 'hourly' ? 'active' : ''}`} onClick={() => onServiceFilterChange('hourly')}>
                            <Clock size={14} />{t('valet.hourly')}
                        </button>
                        <button type="button" className={`segment-btn ${serviceFilter === 'package' ? 'active' : ''}`} onClick={() => onServiceFilterChange('package')}>
                            <Package size={14} />{t('valet.package')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div className="control-panel-bottom">
            <div className="search-filter">
                <Search size={18} className="search-filter-icon" />
                <input
                    type="text"
                    className="search-filter-input"
                    placeholder={t('valet.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                    <button type="button" className="search-filter-clear" onClick={() => onSearchChange('')} aria-label={t('common.cancel')}>
                        <X size={16} />
                    </button>
                )}
            </div>
            <div className="date-selector">
                <EthiopianDatePicker value={selectedDate} onChange={onDateChange} label="Select Date" />
            </div>
        </div>
        {(serviceFilter !== 'all' || searchQuery) && (
            <p className="filters-result-count">{t('valet.showingResults', { count: filteredCount, total: totalCount })}</p>
        )}
    </div>
);

export default ParkedCarsFilterBar;
