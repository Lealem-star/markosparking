const { Router } = require("express")
const PricingSettings = require("../models/pricingSettingsSchema");
const Joi = require('joi');
const { isLoggedIn } = require("./middleware");

const pricingSettingsRouter = Router();

// Get pricing settings (public endpoint - no auth required for reading)
pricingSettingsRouter.get("/", async (req, res) => {
    try {
        const settings = await PricingSettings.getOrCreate();
        res.json(settings.settings || {});
    } catch (error) {
        console.error("Error fetching pricing settings: ", error);
        res.status(400).json({ error: error.message });
    }
});

// Update pricing settings (requires authentication)
pricingSettingsRouter.put("/", isLoggedIn, async (req, res) => {
    try {
        const User = require("../models/userSchema");
        const currentUser = await User.findOne({ phoneNumber: req.user?.phoneNumber });
        
        // Only system_admin can update pricing settings
        if (!currentUser || currentUser.type !== 'system_admin') {
            return res.status(403).json({ error: "Only system admin can update pricing settings" });
        }

        const { settings } = req.body;

        // Input validation - support price levels structure: {priceLevels: {[name]: {carType: {...}}}}
        const carTypePricingSchema = Joi.object({
            hourly: Joi.number().min(0).optional(),
            weekly: Joi.number().min(0).optional(),
            monthly: Joi.number().min(0).optional(),
            yearly: Joi.number().min(0).optional()
        }).or('hourly', 'weekly', 'monthly', 'yearly');

        const priceLevelSchema = Joi.object().pattern(
            Joi.string().valid('tripod', 'automobile', 'truck', 'trailer', 'special_vehicles'),
            carTypePricingSchema
        );

        const schema = Joi.object({
            settings: Joi.object({
                priceLevels: Joi.object().pattern(Joi.string(), priceLevelSchema).optional(),
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
            }).allow({}) // Allow other fields for backward compatibility
        });

        const { error } = schema.validate({ settings });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Get or create settings document
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

        // Update settings object
        pricingSettings.settings = mergedSettings;
        await pricingSettings.save();

        res.json({ message: "Pricing settings updated successfully", settings: pricingSettings.settings });
    } catch (error) {
        console.error("Error updating pricing settings: ", error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = pricingSettingsRouter;

