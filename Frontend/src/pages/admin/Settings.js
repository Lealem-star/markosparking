import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchPricingSettings, updatePricingSettings, fetchUsers } from '../../api/api';
import { X as XIcon } from 'lucide-react';
import { VatRateConfiguration, CarTypePricingConfiguration, AddPriceLevelModal, emptyPricing, CAR_TYPES } from './settingsModules';
import '../../css/settings.scss';
import '../../css/vatConfiguration.scss';
import '../../css/pricingConfiguration.scss';

const formatLastUpdated = () =>
    new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const Settings = () => {
    const { t } = useTranslation();
    const user = useSelector((state) => state.user);
    const [priceLevels, setPriceLevels] = useState({});
    const [users, setUsers] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(formatLastUpdated());
    const [vatRate, setVatRate] = useState(0.15);
    const [vatEnabled, setVatEnabled] = useState(true);
    const [vatHistory, setVatHistory] = useState([]);
    const [activeSection, setActiveSection] = useState('pricing'); // 'pricing' | 'vat'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [editingPriceLevel, setEditingPriceLevel] = useState(null);
    const [editingCarType, setEditingCarType] = useState(null);
    const [editPrices, setEditPrices] = useState({
        hourly: '',
        weekly: '',
        monthly: '',
        yearly: ''
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPriceLevelName, setNewPriceLevelName] = useState('');
    const [newPriceLevelPricing, setNewPriceLevelPricing] = useState(emptyPricing());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [priceLevelToDelete, setPriceLevelToDelete] = useState(null);
    const [editingVAT, setEditingVAT] = useState(false);
    const [vatInput, setVatInput] = useState('');

    useEffect(() => {
        fetchUsers({ setUsers });
        fetchPricingSettings({
            setPricingSettings: (data) => {
                // Support price levels structure: {priceLevels: {[name]: {carType: {...}}}}
                if (data && data.priceLevels) {
                    setPriceLevels(data.priceLevels);
                } else {
                    // Backward compatibility or empty state
                    setPriceLevels({});
                }
                // Load VAT rate
                if (data && data.vatRate !== undefined) {
                    setVatRate(data.vatRate);
                    setVatInput((data.vatRate * 100).toFixed(2));
                } else {
                    setVatRate(0.15);
                    setVatInput('15.00');
                }
                setVatEnabled(data?.vatEnabled !== false);
                setVatHistory(Array.isArray(data?.vatRateHistory) ? data.vatRateHistory : []);
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const persistSettings = (settingsToSave, successMessage) => {
        setLoading(true);
        setError('');
        setSuccess('');

        updatePricingSettings({
            settings: settingsToSave,
            token: user?.token,
            handleUpdateSuccess: (data) => {
                const saved = data?.settings;
                if (saved?.vatRateHistory) {
                    setVatHistory(saved.vatRateHistory);
                }
                if (saved?.vatEnabled !== undefined) {
                    setVatEnabled(saved.vatEnabled);
                }
                if (saved?.vatRate !== undefined) {
                    setVatRate(saved.vatRate);
                    setVatInput((saved.vatRate * 100).toFixed(2));
                }
                setSuccess(successMessage);
                setLastUpdated(formatLastUpdated());
                setLoading(false);
                setTimeout(() => setSuccess(''), 3000);
            },
            handleUpdateFailure: (errorMessage) => {
                setError(errorMessage);
                setLoading(false);
            }
        });
    };

    // Save price levels to database
    const savePriceLevels = (updatedPriceLevels) => {
        const settingsToSave = { priceLevels: {}, vatRate, vatEnabled };
        Object.keys(updatedPriceLevels).forEach(priceLevelName => {
            const priceLevel = updatedPriceLevels[priceLevelName];
            settingsToSave.priceLevels[priceLevelName] = {};
            CAR_TYPES.forEach(carType => {
                const carPricing = priceLevel[carType] || {};
                settingsToSave.priceLevels[priceLevelName][carType] = {
                    hourly: carPricing.hourly ? parseFloat(carPricing.hourly) || 0 : 0,
                    weekly: carPricing.weekly ? parseFloat(carPricing.weekly) || 0 : 0,
                    monthly: carPricing.monthly ? parseFloat(carPricing.monthly) || 0 : 0,
                    yearly: carPricing.yearly ? parseFloat(carPricing.yearly) || 0 : 0
                };
            });
        });

        persistSettings(settingsToSave, t('settings.priceLevelSaved'));
    };

    // Handle edit price level car type pricing
    const handleEditCarTypePricing = (priceLevelName, carType) => {
        setEditingPriceLevel(priceLevelName);
        setEditingCarType(carType);
        const priceLevel = priceLevels[priceLevelName] || {};
        const carPricing = priceLevel[carType] || {};
        setEditPrices({
            hourly: carPricing.hourly?.toString() || '',
            weekly: carPricing.weekly?.toString() || '',
            monthly: carPricing.monthly?.toString() || '',
            yearly: carPricing.yearly?.toString() || ''
        });
    };

    // Handle save edit
    const handleSaveEdit = () => {
        if (!editingPriceLevel || !editingCarType) return;
        
        const updatedPriceLevels = {
            ...priceLevels,
            [editingPriceLevel]: {
                ...priceLevels[editingPriceLevel],
                [editingCarType]: {
                    hourly: editPrices.hourly,
                    weekly: editPrices.weekly,
                    monthly: editPrices.monthly,
                    yearly: editPrices.yearly
                }
            }
        };
        
        setPriceLevels(updatedPriceLevels);
        setEditingPriceLevel(null);
        setEditingCarType(null);
        setEditPrices({ hourly: '', weekly: '', monthly: '', yearly: '' });
        savePriceLevels(updatedPriceLevels);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingPriceLevel(null);
        setEditingCarType(null);
        setEditPrices({ hourly: '', weekly: '', monthly: '', yearly: '' });
    };

    // Handle add price level
    const handleAddPriceLevel = () => {
        if (!newPriceLevelName || !newPriceLevelName.trim()) {
            setError('Price level name is required');
            return;
        }
        if (priceLevels[newPriceLevelName.trim()]) {
            setError('Price level name already exists');
            return;
        }

        const updatedPriceLevels = {
            ...priceLevels,
            [newPriceLevelName.trim()]: newPriceLevelPricing
        };
        
        setPriceLevels(updatedPriceLevels);
        setNewPriceLevelName('');
        setNewPriceLevelPricing(emptyPricing());
        setShowAddModal(false);
        setError('');
        savePriceLevels(updatedPriceLevels);
    };

    // Handle delete car type pricing (reset to zero)
    const handleDeleteCarType = (priceLevelName, carType) => {
        const updatedPriceLevels = {
            ...priceLevels,
            [priceLevelName]: {
                ...priceLevels[priceLevelName],
                [carType]: { hourly: 0, weekly: 0, monthly: 0, yearly: 0 },
            },
        };

        setPriceLevels(updatedPriceLevels);
        if (editingPriceLevel === priceLevelName && editingCarType === carType) {
            handleCancelEdit();
        }
        savePriceLevels(updatedPriceLevels);
    };

    // Handle delete price level
    const handleDelete = (priceLevelName) => {
        setPriceLevelToDelete(priceLevelName);
        setShowDeleteModal(true);
    };

    // Confirm delete
    const confirmDelete = () => {
        if (!priceLevelToDelete) return;
        const updatedPriceLevels = { ...priceLevels };
        delete updatedPriceLevels[priceLevelToDelete];
        setPriceLevels(updatedPriceLevels);
        setShowDeleteModal(false);
        setPriceLevelToDelete(null);
        savePriceLevels(updatedPriceLevels);
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setPriceLevelToDelete(null);
    };

    // Handle VAT rate edit
    const handleEditVAT = () => {
        setEditingVAT(true);
        setVatInput((vatRate * 100).toFixed(2));
        setError('');
    };

    // Handle VAT rate save
    const handleSaveVAT = () => {
        const vatPercentage = parseFloat(vatInput);
        if (isNaN(vatPercentage) || vatPercentage < 0 || vatPercentage > 100) {
            setError(t('settings.vatRateMustBeValid'));
            return;
        }
        const newVatRate = vatPercentage / 100;
        setEditingVAT(false);
        setError('');

        persistSettings({
            priceLevels,
            vatRate: newVatRate,
            vatEnabled,
        }, t('settings.vatRateUpdated'));
    };

    // Handle VAT rate cancel
    const handleCancelVAT = () => {
        setEditingVAT(false);
        setVatInput((vatRate * 100).toFixed(2));
        setError('');
    };

    const handleToggleVatEnabled = (enabled) => {
        persistSettings({
            priceLevels,
            vatRate,
            vatEnabled: enabled,
        }, enabled ? t('settings.vatEnabledSuccess') : t('settings.vatDisabledSuccess'));
    };

    const handleShowVatHelp = () => {
        window.alert(t('settings.vatHelpText'));
    };

    return (
        <div className="settings-page">
            <div className="settings-toggle">
                <button
                    type="button"
                    className={`toggle-btn ${activeSection === 'pricing' ? 'active' : ''}`}
                    onClick={() => setActiveSection('pricing')}
                    disabled={loading}
                >
                    {t('settings.carTypePricingConfiguration')}
                </button>
                <button
                    type="button"
                    className={`toggle-btn ${activeSection === 'vat' ? 'active' : ''}`}
                    onClick={() => setActiveSection('vat')}
                    disabled={loading}
                >
                    {t('settings.vatRateConfiguration')}
                </button>
            </div>

            {activeSection === 'vat' && (
                <VatRateConfiguration
                    t={t}
                    vatRate={vatRate}
                    vatEnabled={vatEnabled}
                    vatHistory={vatHistory}
                    editingVAT={editingVAT}
                    vatInput={vatInput}
                    loading={loading}
                    success={success}
                    error={error}
                    onToggleEnabled={handleToggleVatEnabled}
                    onEditRate={handleEditVAT}
                    onVatInputChange={(value) => {
                        setVatInput(value);
                        setError('');
                    }}
                    onSave={handleSaveVAT}
                    onCancel={handleCancelVAT}
                    onShowHelp={handleShowVatHelp}
                />
            )}

            {activeSection === 'pricing' && (
                <CarTypePricingConfiguration
                    t={t}
                    priceLevels={priceLevels}
                    users={users}
                    lastUpdated={lastUpdated}
                    loading={loading}
                    success={success}
                    error={error}
                    editingPriceLevel={editingPriceLevel}
                    editingCarType={editingCarType}
                    editPrices={editPrices}
                    onEditPricesChange={setEditPrices}
                    onEdit={handleEditCarTypePricing}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDeleteCarType={handleDeleteCarType}
                    onDeletePriceLevel={handleDelete}
                    onAddPriceLevel={() => setShowAddModal(true)}
                />
            )}

            <AddPriceLevelModal
                t={t}
                isOpen={showAddModal}
                name={newPriceLevelName}
                pricing={newPriceLevelPricing}
                error={error}
                loading={loading}
                onClose={() => {
                    setShowAddModal(false);
                    setNewPriceLevelName('');
                    setNewPriceLevelPricing(emptyPricing());
                    setError('');
                }}
                onNameChange={(value) => {
                    setNewPriceLevelName(value);
                    setError('');
                }}
                onPricingChange={(carType, field, value) => {
                    setNewPriceLevelPricing({
                        ...newPriceLevelPricing,
                        [carType]: { ...newPriceLevelPricing[carType], [field]: value }
                    });
                }}
                onSubmit={handleAddPriceLevel}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('settings.deletePriceLevel')}</h2>
                            <button 
                                className="modal-close"
                                onClick={cancelDelete}
                            >
                                <XIcon size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                {t('settings.deleteConfirmation')} <strong>"{priceLevelToDelete}"</strong>?
                            </p>
                            <p className="warning-text">{t('settings.cannotBeUndone')}</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-cancel"
                                onClick={cancelDelete}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-delete-confirm"
                                onClick={confirmDelete}
                                disabled={loading}
                            >
                                {loading ? t('settings.deleting') : t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;

