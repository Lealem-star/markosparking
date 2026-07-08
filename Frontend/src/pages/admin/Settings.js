import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    VatRateConfiguration,
    CarTypePricingConfiguration,
    AddPriceLevelModal,
    AddParkingZoneModal,
    EditParkingZoneModal,
    DeleteParkingZoneModal,
    EditPriceLevelModal,
    DeletePriceLevelModal,
    SettingsSectionToggle,
    useSettingsPage,
} from './settingsModules';
import '../../styles/settings.scss';
import '../../styles/vatConfiguration.scss';
import '../../styles/pricingConfiguration.scss';

const Settings = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const settings = useSettingsPage(user, t);
    const priceLevelNames = useMemo(
        () => Object.keys(settings.priceLevels || {}).sort(),
        [settings.priceLevels]
    );

    return (
        <div className="settings-page">
            <SettingsSectionToggle
                t={t}
                activeSection={settings.activeSection}
                loading={settings.loading}
                onChange={settings.setActiveSection}
            />

            {settings.activeSection === 'vat' && (
                <VatRateConfiguration
                    t={t}
                    vatRate={settings.vatRate}
                    vatEnabled={settings.vatEnabled}
                    vatHistory={settings.vatHistory}
                    editingVAT={settings.editingVAT}
                    vatInput={settings.vatInput}
                    loading={settings.loading}
                    success={settings.success}
                    error={settings.error}
                    onToggleEnabled={settings.handleToggleVatEnabled}
                    onEditRate={settings.handleEditVAT}
                    onVatInputChange={(value) => {
                        settings.setVatInput(value);
                        settings.setError('');
                    }}
                    onSave={settings.handleSaveVAT}
                    onCancel={settings.handleCancelVAT}
                    onShowHelp={settings.handleShowVatHelp}
                />
            )}

            {settings.activeSection === 'pricing' && (
                <CarTypePricingConfiguration
                    t={t}
                    priceLevels={settings.priceLevels}
                    parkZones={settings.parkZones}
                    users={settings.users}
                    lastUpdated={settings.lastUpdated}
                    loading={settings.loading}
                    success={settings.success}
                    error={settings.error}
                    onDeletePriceLevel={settings.handleDelete}
                    onAddPriceLevel={() => settings.setShowAddModal(true)}
                    onAddParkingZone={() => settings.setShowAddZoneModal(true)}
                    onEditParkingZone={settings.handleOpenEditParkingZone}
                    onToggleParkingZoneStatus={settings.handleToggleParkingZoneStatus}
                    onOpenEditPriceLevel={settings.handleOpenEditPriceLevel}
                />
            )}

            <AddParkingZoneModal
                t={t}
                isOpen={settings.showAddZoneModal}
                form={settings.newZoneForm}
                priceLevelNames={priceLevelNames}
                error={settings.error}
                loading={settings.loading}
                onClose={settings.closeAddZoneModal}
                onChange={(field, value) => {
                    settings.setNewZoneForm({ ...settings.newZoneForm, [field]: value });
                    settings.setError('');
                }}
                onSubmit={settings.handleAddParkingZone}
            />

            <EditParkingZoneModal
                t={t}
                isOpen={settings.showEditZoneModal}
                zone={settings.editingZone}
                form={settings.editZoneForm}
                priceLevelNames={priceLevelNames}
                error={settings.error}
                loading={settings.loading}
                onClose={settings.closeEditZoneModal}
                onChange={(field, value) => {
                    settings.setEditZoneForm({ ...settings.editZoneForm, [field]: value });
                    settings.setError('');
                }}
                onSubmit={settings.handleSaveParkingZoneEdit}
            />

            <DeleteParkingZoneModal
                t={t}
                isOpen={settings.showDeleteZoneModal}
                zone={settings.zoneToDelete}
                loading={settings.loading}
                onCancel={settings.cancelDeleteParkingZone}
                onConfirm={settings.confirmDeleteParkingZone}
            />

            <AddPriceLevelModal
                t={t}
                isOpen={settings.showAddModal}
                name={settings.newPriceLevelName}
                pricing={settings.newPriceLevelPricing}
                error={settings.error}
                loading={settings.loading}
                onClose={settings.closeAddModal}
                onNameChange={(value) => {
                    settings.setNewPriceLevelName(value);
                    settings.setError('');
                }}
                onPricingChange={(carType, field, value) => {
                    settings.setNewPriceLevelPricing({
                        ...settings.newPriceLevelPricing,
                        [carType]: { ...settings.newPriceLevelPricing[carType], [field]: value },
                    });
                }}
                onSubmit={settings.handleAddPriceLevel}
            />

            <EditPriceLevelModal
                t={t}
                isOpen={settings.showEditModal}
                priceLevelName={settings.editingPriceLevelName}
                pricing={settings.editPriceLevelPricing}
                error={settings.error}
                loading={settings.loading}
                onClose={settings.closeEditModal}
                onPricingChange={settings.handleEditPriceLevelPricingChange}
                onSubmit={settings.handleSavePriceLevelEdit}
            />

            <DeletePriceLevelModal
                t={t}
                isOpen={settings.showDeleteModal}
                priceLevelName={settings.priceLevelToDelete}
                loading={settings.loading}
                onCancel={settings.cancelDelete}
                onConfirm={settings.confirmDelete}
            />
        </div>
    );
};

export default Settings;
