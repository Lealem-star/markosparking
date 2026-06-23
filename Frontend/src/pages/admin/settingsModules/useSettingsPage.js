import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { savePricingSettings } from '../../../api/paymentApi';
import { getApiError } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { usePricingSettingsQuery, useUsersQuery } from '../../../hooks/queries';
import { CAR_TYPES, emptyPricing } from './pricing';
import {
    buildPriceLevelsPayload,
    formatLastUpdated,
    parsePricingSettingsResponse,
    validateNewPriceLevelName,
    validateVatPercentage,
} from './settingsUtils';

const EMPTY_EDIT_PRICES = { hourly: '', weekly: '', monthly: '', yearly: '' };

export const useSettingsPage = (user, t) => {
    const queryClient = useQueryClient();
    const { data: users = [] } = useUsersQuery(user?.token);
    const { data: pricingData } = usePricingSettingsQuery();
    const [priceLevels, setPriceLevels] = useState({});
    const [lastUpdated, setLastUpdated] = useState(formatLastUpdated());
    const [vatRate, setVatRate] = useState(0.15);
    const [vatEnabled, setVatEnabled] = useState(true);
    const [vatHistory, setVatHistory] = useState([]);
    const [activeSection, setActiveSection] = useState('pricing');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [editingPriceLevel, setEditingPriceLevel] = useState(null);
    const [editingCarType, setEditingCarType] = useState(null);
    const [editPrices, setEditPrices] = useState(EMPTY_EDIT_PRICES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPriceLevelName, setNewPriceLevelName] = useState('');
    const [newPriceLevelPricing, setNewPriceLevelPricing] = useState(emptyPricing());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [priceLevelToDelete, setPriceLevelToDelete] = useState(null);
    const [editingVAT, setEditingVAT] = useState(false);
    const [vatInput, setVatInput] = useState('15.00');

    const applySavedSettings = useCallback((saved) => {
        if (saved?.vatRateHistory) setVatHistory(saved.vatRateHistory);
        if (saved?.vatEnabled !== undefined) setVatEnabled(saved.vatEnabled);
        if (saved?.vatRate !== undefined) {
            setVatRate(saved.vatRate);
            setVatInput((saved.vatRate * 100).toFixed(2));
        }
        if (saved?.priceLevels) setPriceLevels(saved.priceLevels);
    }, []);

    useEffect(() => {
        if (!pricingData) return;

        const parsed = parsePricingSettingsResponse(pricingData);
        setPriceLevels(parsed.priceLevels);
        setVatRate(parsed.vatRate);
        setVatInput((parsed.vatRate * 100).toFixed(2));
        setVatEnabled(parsed.vatEnabled);
        setVatHistory(parsed.vatHistory);
    }, [pricingData]);

    const persistSettings = useCallback(async (settingsToSave, successMessage) => {
        if (!user?.token) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = await savePricingSettings(settingsToSave, user.token);
            applySavedSettings(data?.settings);
            queryClient.invalidateQueries({ queryKey: queryKeys.pricingSettings() });
            setSuccess(successMessage);
            setLastUpdated(formatLastUpdated());
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(getApiError(err, 'Failed to update pricing settings'));
        } finally {
            setLoading(false);
        }
    }, [user?.token, applySavedSettings, queryClient]);

    const savePriceLevels = useCallback((updatedPriceLevels) => {
        const settingsToSave = buildPriceLevelsPayload(updatedPriceLevels, CAR_TYPES, vatRate, vatEnabled);
        persistSettings(settingsToSave, t('settings.priceLevelSaved'));
    }, [vatRate, vatEnabled, persistSettings, t]);

    const handleEditCarTypePricing = useCallback((priceLevelName, carType) => {
        setEditingPriceLevel(priceLevelName);
        setEditingCarType(carType);
        const carPricing = priceLevels[priceLevelName]?.[carType] || {};
        setEditPrices({
            hourly: carPricing.hourly?.toString() || '',
            weekly: carPricing.weekly?.toString() || '',
            monthly: carPricing.monthly?.toString() || '',
            yearly: carPricing.yearly?.toString() || '',
        });
    }, [priceLevels]);

    const handleSaveEdit = useCallback(() => {
        if (!editingPriceLevel || !editingCarType) return;

        const updatedPriceLevels = {
            ...priceLevels,
            [editingPriceLevel]: {
                ...priceLevels[editingPriceLevel],
                [editingCarType]: { ...editPrices },
            },
        };

        setPriceLevels(updatedPriceLevels);
        setEditingPriceLevel(null);
        setEditingCarType(null);
        setEditPrices(EMPTY_EDIT_PRICES);
        savePriceLevels(updatedPriceLevels);
    }, [editPrices, editingCarType, editingPriceLevel, priceLevels, savePriceLevels]);

    const handleCancelEdit = useCallback(() => {
        setEditingPriceLevel(null);
        setEditingCarType(null);
        setEditPrices(EMPTY_EDIT_PRICES);
    }, []);

    const handleAddPriceLevel = useCallback(() => {
        const validationError = validateNewPriceLevelName(newPriceLevelName, priceLevels);
        if (validationError) {
            setError(validationError);
            return;
        }

        const trimmedName = newPriceLevelName.trim();
        const updatedPriceLevels = {
            ...priceLevels,
            [trimmedName]: newPriceLevelPricing,
        };

        setPriceLevels(updatedPriceLevels);
        setNewPriceLevelName('');
        setNewPriceLevelPricing(emptyPricing());
        setShowAddModal(false);
        setError('');
        savePriceLevels(updatedPriceLevels);
    }, [newPriceLevelName, newPriceLevelPricing, priceLevels, savePriceLevels]);

    const handleDeleteCarType = useCallback((priceLevelName, carType) => {
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
    }, [editingCarType, editingPriceLevel, handleCancelEdit, priceLevels, savePriceLevels]);

    const handleDelete = useCallback((priceLevelName) => {
        setPriceLevelToDelete(priceLevelName);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!priceLevelToDelete) return;

        const updatedPriceLevels = { ...priceLevels };
        delete updatedPriceLevels[priceLevelToDelete];
        setPriceLevels(updatedPriceLevels);
        setShowDeleteModal(false);
        setPriceLevelToDelete(null);
        savePriceLevels(updatedPriceLevels);
    }, [priceLevelToDelete, priceLevels, savePriceLevels]);

    const cancelDelete = useCallback(() => {
        setShowDeleteModal(false);
        setPriceLevelToDelete(null);
    }, []);

    const handleEditVAT = useCallback(() => {
        setEditingVAT(true);
        setVatInput((vatRate * 100).toFixed(2));
        setError('');
    }, [vatRate]);

    const handleSaveVAT = useCallback(() => {
        const newVatRate = validateVatPercentage(vatInput);
        if (newVatRate === null) {
            setError(t('settings.vatRateMustBeValid'));
            return;
        }

        setEditingVAT(false);
        setError('');
        persistSettings({ priceLevels, vatRate: newVatRate, vatEnabled }, t('settings.vatRateUpdated'));
    }, [vatInput, priceLevels, vatEnabled, persistSettings, t]);

    const handleCancelVAT = useCallback(() => {
        setEditingVAT(false);
        setVatInput((vatRate * 100).toFixed(2));
        setError('');
    }, [vatRate]);

    const handleToggleVatEnabled = useCallback((enabled) => {
        persistSettings(
            { priceLevels, vatRate, vatEnabled: enabled },
            enabled ? t('settings.vatEnabledSuccess') : t('settings.vatDisabledSuccess')
        );
    }, [priceLevels, vatRate, persistSettings, t]);

    const handleShowVatHelp = useCallback(() => {
        window.alert(t('settings.vatHelpText'));
    }, [t]);

    const closeAddModal = useCallback(() => {
        setShowAddModal(false);
        setNewPriceLevelName('');
        setNewPriceLevelPricing(emptyPricing());
        setError('');
    }, []);

    return {
        activeSection,
        setActiveSection,
        priceLevels,
        users,
        lastUpdated,
        vatRate,
        vatEnabled,
        vatHistory,
        loading,
        success,
        error,
        setError,
        editingPriceLevel,
        editingCarType,
        editPrices,
        setEditPrices,
        showAddModal,
        setShowAddModal,
        newPriceLevelName,
        setNewPriceLevelName,
        newPriceLevelPricing,
        setNewPriceLevelPricing,
        showDeleteModal,
        priceLevelToDelete,
        editingVAT,
        vatInput,
        setVatInput,
        handleEditCarTypePricing,
        handleSaveEdit,
        handleCancelEdit,
        handleAddPriceLevel,
        handleDeleteCarType,
        handleDelete,
        confirmDelete,
        cancelDelete,
        handleEditVAT,
        handleSaveVAT,
        handleCancelVAT,
        handleToggleVatEnabled,
        handleShowVatHelp,
        closeAddModal,
    };
};
