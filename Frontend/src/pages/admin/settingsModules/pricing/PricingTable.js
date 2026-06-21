import React from 'react';
import { Car, Truck, Container, CircleDot, Edit2, Check, Trash2, X as XIcon } from 'lucide-react';
import { CAR_TYPES, formatPricingValue } from './pricingUtils';

const carTypeIcons = {
    tripod: CircleDot,
    automobile: Car,
    truck: Truck,
    trailer: Container,
    special_vehicles: Car,
};

const PricingTable = ({
    t,
    priceLevelName,
    pricing,
    editingPriceLevel,
    editingCarType,
    editPrices,
    onEditPricesChange,
    onEdit,
    onSave,
    onCancel,
    onDeleteCarType,
    loading,
}) => (
    <div className="pricing-table-wrap">
        <table className="pricing-table">
            <thead>
                <tr>
                    <th>{t('settings.carType')}</th>
                    <th>{t('settings.hourlyRate')}</th>
                    <th>{t('settings.weeklyPackage')}</th>
                    <th>{t('settings.monthlyPackage')}</th>
                    <th>{t('settings.yearlyPackage')}</th>
                    <th>{t('settings.actions')}</th>
                </tr>
            </thead>
            <tbody>
                {CAR_TYPES.map((carType) => {
                    const carPricing = pricing[carType] || {};
                    const isEditing = editingPriceLevel === priceLevelName && editingCarType === carType;
                    const Icon = carTypeIcons[carType] || Car;

                    const renderCell = (field) => (
                        isEditing ? (
                            <input
                                type="number"
                                min="0"
                                value={editPrices[field]}
                                onChange={(e) => onEditPricesChange({ ...editPrices, [field]: e.target.value })}
                                className="pricing-edit-input"
                            />
                        ) : (
                            <span className="pricing-value">{formatPricingValue(carPricing[field])}</span>
                        )
                    );

                    return (
                        <tr key={carType}>
                            <td>
                                <div className="pricing-car-type-cell">
                                    <span className={`pricing-car-icon pricing-car-icon--${carType}`}>
                                        <Icon size={16} />
                                    </span>
                                    <span>{t(`valet.carType_${carType}`)}</span>
                                </div>
                            </td>
                            <td>{renderCell('hourly')}</td>
                            <td>{renderCell('weekly')}</td>
                            <td>{renderCell('monthly')}</td>
                            <td>{renderCell('yearly')}</td>
                            <td>
                                <div className="pricing-row-actions">
                                    {isEditing ? (
                                        <>
                                            <button type="button" className="pricing-action-btn pricing-action-btn--save" onClick={onSave} disabled={loading}>
                                                <Check size={14} />
                                            </button>
                                            <button type="button" className="pricing-action-btn pricing-action-btn--cancel" onClick={onCancel} disabled={loading}>
                                                <XIcon size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="pricing-action-btn pricing-action-btn--edit"
                                                onClick={() => onEdit(priceLevelName, carType)}
                                                disabled={loading}
                                                aria-label={t('common.edit')}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="pricing-action-btn pricing-action-btn--delete"
                                                onClick={() => onDeleteCarType(priceLevelName, carType)}
                                                disabled={loading}
                                                aria-label={t('common.delete')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default PricingTable;
