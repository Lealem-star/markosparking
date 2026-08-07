const Joi = require('joi');
const AppError = require('../errors/AppError');
const PricingSettings = require('../models/pricingSettingsSchema');
const { logAudit } = require('../services/auditLogService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const updatePricingSchema = Joi.object({
    settings: Joi.object({
        priceLevels: Joi.object().pattern(
            Joi.string(),
            Joi.object().pattern(
                Joi.string().valid('tripod', 'automobile', 'truck', 'trailer', 'special_vehicles'),
                Joi.object({
                    hourly: Joi.number().min(0).optional(),
                    weekly: Joi.number().min(0).optional(),
                    monthly: Joi.number().min(0).optional(),
                    yearly: Joi.number().min(0).optional(),
                }).or('hourly', 'weekly', 'monthly', 'yearly')
            )
        ).optional(),
        vatRate: Joi.number().min(0).max(1).optional(),
        vatEnabled: Joi.boolean().optional(),
        vatRateHistory: Joi.array().items(
            Joi.object({
                rate: Joi.number().min(0).max(1).required(),
                status: Joi.string().valid('active', 'inactive').required(),
                effectiveFrom: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
                updatedBy: Joi.string().allow('').optional(),
                notes: Joi.string().allow('').optional(),
            })
        ).optional(),
    }).allow({}),
});

const getSettings = async (req, res) => {
    const settings = await PricingSettings.getOrCreate();
    res.json(settings.settings || {});
};

const updateSettings = async (req, res) => {
    const User = require('../models/userSchema');
    const currentUser = await User.findOne({ phoneNumber: req.user?.phoneNumber });

    if (!currentUser || currentUser.type !== 'system_admin') {
        throw new AppError('Only system admin can update pricing settings', 403);
    }

    const { settings } = req.validated.body;
    let pricingSettings = await PricingSettings.getOrCreate();
    const previousSettings = pricingSettings.settings || {};
    const mergedSettings = { ...previousSettings, ...settings };

    if (settings.vatRate !== undefined && settings.vatRate !== previousSettings.vatRate) {
        const history = [...(previousSettings.vatRateHistory || [])].map((entry) =>
            entry.status === 'active' ? { ...entry, status: 'inactive' } : entry
        );

        history.unshift({
            rate: settings.vatRate,
            status: 'active',
            effectiveFrom: new Date().toISOString(),
            updatedBy: currentUser.name,
            notes: settings.vatRateChangeNotes || 'VAT rate updated',
        });

        mergedSettings.vatRateHistory = history;
    }

    if (!mergedSettings.vatRateHistory?.length && mergedSettings.vatRate !== undefined) {
        mergedSettings.vatRateHistory = [{
            rate: mergedSettings.vatRate,
            status: 'active',
            effectiveFrom: new Date().toISOString(),
            updatedBy: currentUser.name,
            notes: 'Initial VAT rate configuration',
        }];
    }

    if (settings.vatEnabled !== undefined) {
        mergedSettings.vatEnabled = settings.vatEnabled;
    } else if (mergedSettings.vatEnabled === undefined) {
        mergedSettings.vatEnabled = true;
    }

    delete mergedSettings.vatRateChangeNotes;

    pricingSettings.settings = mergedSettings;
    await pricingSettings.save();

    if (settings.priceLevels !== undefined) {
        await logAudit({
            action: AUDIT_ACTIONS.PRICING_UPDATED,
            actor: currentUser,
            targetType: 'settings',
            summary: 'Updated parking price levels',
            metadata: { priceLevels: settings.priceLevels },
            req,
        });
    }

    if (settings.vatRate !== undefined && settings.vatRate !== previousSettings.vatRate) {
        await logAudit({
            action: AUDIT_ACTIONS.VAT_UPDATED,
            actor: currentUser,
            targetType: 'settings',
            summary: `Changed VAT rate from ${((previousSettings.vatRate || 0) * 100).toFixed(1)}% to ${(settings.vatRate * 100).toFixed(1)}%`,
            metadata: {
                previousRate: previousSettings.vatRate,
                newRate: settings.vatRate,
            },
            req,
        });
    }

    if (settings.vatEnabled !== undefined && settings.vatEnabled !== previousSettings.vatEnabled) {
        await logAudit({
            action: AUDIT_ACTIONS.VAT_TOGGLED,
            actor: currentUser,
            targetType: 'settings',
            summary: settings.vatEnabled ? 'Enabled VAT on parking fees' : 'Disabled VAT on parking fees',
            metadata: {
                previousEnabled: previousSettings.vatEnabled,
                vatEnabled: settings.vatEnabled,
            },
            req,
        });
    }

    res.json({ message: 'Pricing settings updated successfully', settings: pricingSettings.settings });
};

module.exports = { updatePricingSchema, getSettings, updateSettings };
