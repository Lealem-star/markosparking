import React, { useState } from 'react';
import { Car, ChevronDown } from 'lucide-react';
import StaffTable from './StaffTable';

const ZoneAccordion = ({
    zones,
    t,
    managerialCount,
    onEdit,
    onDeactivate,
    onReactivate,
    defaultExpandedZone = null,
}) => {
    const [expandedZones, setExpandedZones] = useState(() => {
        if (defaultExpandedZone) return new Set([defaultExpandedZone]);
        if (zones.length > 0) return new Set([zones[0].zoneCode]);
        return new Set();
    });

    const toggleZone = (zoneCode) => {
        setExpandedZones((prev) => {
            const next = new Set(prev);
            if (next.has(zoneCode)) next.delete(zoneCode);
            else next.add(zoneCode);
            return next;
        });
    };

    if (zones.length === 0) {
        return (
            <div className="staff-empty-message">
                <em>{t('admin.noValetStaff')}</em>
            </div>
        );
    }

    let runningIndex = managerialCount;

    return (
        <div className="staff-zone-accordion">
            {zones.map(({ zoneCode, staff }) => {
                const isExpanded = expandedZones.has(zoneCode);
                const startIndex = runningIndex;
                runningIndex += staff.length;

                return (
                    <div key={zoneCode} className={`staff-zone-item ${isExpanded ? 'is-expanded' : ''}`}>
                        <button
                            type="button"
                            className="staff-zone-trigger"
                            onClick={() => toggleZone(zoneCode)}
                            aria-expanded={isExpanded}
                        >
                            <ChevronDown size={18} className="staff-zone-chevron" />
                            <Car size={18} className="staff-zone-icon" />
                            <span className="staff-zone-name">{zoneCode}</span>
                            <span className="staff-zone-count">{staff.length}</span>
                        </button>
                        {isExpanded && (
                            <div className="staff-zone-panel">
                                <StaffTable
                                    staffList={staff}
                                    startIndex={startIndex}
                                    t={t}
                                    onEdit={onEdit}
                                    onDeactivate={onDeactivate}
                                    onReactivate={onReactivate}
                                    emptyMessage={t('admin.noValetStaff')}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ZoneAccordion;
