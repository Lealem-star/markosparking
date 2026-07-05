import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { getPriceLevelColor } from './pricingUtils';

const PriceLevelListTable = ({
    t,
    priceLevelNames,
    loading,
    onViewDetails,
    onEdit,
    onDelete,
}) => {
    if (priceLevelNames.length === 0) {
        return (
            <div className="pricing-empty-message">
                <p>{t('settings.noPriceLevels')}</p>
            </div>
        );
    }

    return (
        <div className="pricing-table-wrap pricing-level-list-wrap">
            <table className="pricing-table pricing-level-list-table">
                <thead>
                    <tr>
                        <th>{t('settings.priceLevelName')}</th>
                        <th>{t('settings.viewDetails')}</th>
                        <th>{t('common.edit')}</th>
                        <th>{t('common.delete')}</th>
                    </tr>
                </thead>
                <tbody>
                    {priceLevelNames.map((name, index) => {
                        const colors = getPriceLevelColor(index);
                        return (
                            <tr key={name}>
                                <td>
                                    <span
                                        className="pricing-level-badge pricing-level-badge--table"
                                        style={{
                                            background: colors.bg,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }}
                                    >
                                        {name}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="pricing-level-action-btn pricing-level-action-btn--view"
                                        onClick={() => onViewDetails(name)}
                                        disabled={loading}
                                    >
                                        <Eye size={14} />
                                        {t('settings.viewDetails')}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="pricing-level-action-btn pricing-level-action-btn--edit"
                                        onClick={() => onEdit(name)}
                                        disabled={loading}
                                        aria-label={t('common.edit')}
                                    >
                                        <Edit2 size={14} />
                                        {t('common.edit')}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="pricing-level-action-btn pricing-level-action-btn--delete"
                                        onClick={() => onDelete(name)}
                                        disabled={loading}
                                        aria-label={t('common.delete')}
                                    >
                                        <Trash2 size={14} />
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PriceLevelListTable;
