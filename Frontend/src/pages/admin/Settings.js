import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    VatRateConfiguration,
    CarTypePricingConfiguration,
    AddPriceLevelModal,
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
                    users={settings.users}
                    lastUpdated={settings.lastUpdated}
                    loading={settings.loading}
                    success={settings.success}
                    error={settings.error}
                    onDeletePriceLevel={settings.handleDelete}
                    onAddPriceLevel={() => settings.setShowAddModal(true)}
                    onOpenEditPriceLevel={settings.handleOpenEditPriceLevel}
                />
            )}

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
