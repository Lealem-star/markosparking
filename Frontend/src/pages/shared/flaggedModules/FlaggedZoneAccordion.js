import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import FlaggedCustomersTable from './FlaggedCustomersTable';

const FlaggedZoneAccordion = ({
    groups,
    t,
    loading,
    onPayNow,
    onNotify,
}) => {
    const [expandedIds, setExpandedIds] = useState(() => {
        if (groups.length > 0) return new Set([groups[0].zoneCode]);
        return new Set();
    });

    const toggleGroup = (zoneCode) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(zoneCode)) next.delete(zoneCode);
            else next.add(zoneCode);
            return next;
        });
    };

    if (groups.length === 0) {
        return (
            <div className="flagged-empty-message">
                <p>{t('valet.noFlaggedCars')}</p>
            </div>
        );
    }

    return (
        <div className="flagged-zone-list">
            {groups.map((group) => {
                const isExpanded = expandedIds.has(group.zoneCode);

                return (
                    <article key={group.zoneCode} className={`flagged-zone-card ${isExpanded ? 'is-expanded' : ''}`}>
                        <div className="flagged-zone-card-header">
                            <button
                                type="button"
                                className="flagged-zone-trigger"
                                onClick={() => toggleGroup(group.zoneCode)}
                                aria-expanded={isExpanded}
                            >
                                <MapPin size={18} className="flagged-zone-pin" />
                                <span className="flagged-zone-name">{group.zoneCode}</span>
                                <span className="flagged-zone-count">{group.cars.length}</span>
                            </button>
                            <div className="flagged-zone-header-actions">
                                <div className="flagged-zone-outstanding">
                                    <span className="flagged-zone-outstanding-label">{t('valet.totalOutstanding')}</span>
                                    <span className="flagged-zone-outstanding-value">
                                        {group.totalOutstanding.toFixed(2)} ETB
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="flagged-zone-chevron-btn"
                                    onClick={() => toggleGroup(group.zoneCode)}
                                    aria-expanded={isExpanded}
                                    aria-label={group.zoneCode}
                                >
                                    <ChevronDown size={18} className="flagged-zone-chevron" />
                                </button>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="flagged-zone-panel">
                                <FlaggedCustomersTable
                                    t={t}
                                    cars={group.cars}
                                    loading={loading}
                                    onPayNow={onPayNow}
                                    onNotify={onNotify}
                                />
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
};

export default FlaggedZoneAccordion;
