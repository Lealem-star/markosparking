import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store';
import { resetUserPassword, updateUserRecord, uploadUserProfilePhoto } from '../api/api';
import { getApiError } from '../api/client';
import { syncLanguageWithUser } from '../utils/languageSync';
import { resolveAssetUrl } from '../utils/assetUrl';

export const useProfileUpdate = (user, { includePhoneField = false } = {}) => {
    const dispatch = useDispatch();
    const [profileForm, setProfileForm] = useState({
        name: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        profilePhoto: null,
        profilePhotoPreview: null,
        language: 'en',
    });
    const [isUpdated, setIsUpdated] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const initFormFromUser = useCallback((currentUser) => {
        if (!currentUser) return;
        setProfileForm({
            name: currentUser.name || '',
            phoneNumber: currentUser.phoneNumber || '',
            password: '',
            confirmPassword: '',
            profilePhoto: null,
            profilePhotoPreview: resolveAssetUrl(currentUser.profilePhoto),
            language: currentUser.language || 'en',
        });
        setError('');
        setIsUpdated(false);
    }, []);

    const handleFormChange = useCallback((field, value) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
        setError('');
        setIsUpdated(false);
    }, []);

    const handlePhotoChange = useCallback((file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileForm((prev) => ({
                ...prev,
                profilePhoto: file,
                profilePhotoPreview: reader.result,
            }));
        };
        reader.readAsDataURL(file);
    }, []);

    const resetProfileState = useCallback(() => {
        setError('');
        setIsUpdated(false);
        setLoading(false);
    }, []);

    const submitProfile = useCallback((t, onComplete) => {
        setError('');
        setIsUpdated(false);
        setLoading(true);

        if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
            setError(t('profile.passwordMismatch'));
            setLoading(false);
            return;
        }

        const needsNameUpdate = profileForm.name !== user?.name;
        const needsPhoneNumberUpdate = includePhoneField && profileForm.phoneNumber !== user?.phoneNumber;
        const needsPasswordUpdate = profileForm.password && profileForm.password.length > 0;
        const needsPhotoUpdate = profileForm.profilePhoto !== null;
        const needsLanguageUpdate = profileForm.language !== (user?.language || 'en');

        if (!needsNameUpdate && !needsPhoneNumberUpdate && !needsPasswordUpdate && !needsPhotoUpdate && !needsLanguageUpdate) {
            setError(t('profile.noChangesToSave'));
            setLoading(false);
            return;
        }

        let updatedUser = { ...user };
        let updateChain = Promise.resolve();

        if (needsPhotoUpdate) {
            updateChain = updateChain.then(async () => {
                const data = await uploadUserProfilePhoto(user?._id, profileForm.profilePhoto);
                updatedUser = { ...updatedUser, ...data?.user };
                dispatch(setUser(updatedUser));
            });
        }

        if (needsNameUpdate || needsPhoneNumberUpdate || needsLanguageUpdate) {
            updateChain = updateChain.then(async () => {
                const updateBody = {};
                if (needsNameUpdate) updateBody.name = profileForm.name;
                if (needsPhoneNumberUpdate) updateBody.phoneNumber = profileForm.phoneNumber;
                if (needsLanguageUpdate) updateBody.language = profileForm.language;

                const data = await updateUserRecord(user?._id, updateBody, user?.token);
                updatedUser = { ...updatedUser, ...data?.user };
                dispatch(setUser(updatedUser));
                if (needsLanguageUpdate) {
                    syncLanguageWithUser(profileForm.language);
                }
            });
        }

        if (needsPasswordUpdate) {
            updateChain = updateChain.then(() =>
                resetUserPassword(user?._id, { password: profileForm.password })
            );
        }

        updateChain
            .then(() => {
                setIsUpdated(true);
                setLoading(false);
                if (onComplete) {
                    setTimeout(onComplete, 2000);
                }
            })
            .catch((updateError) => {
                setError(getApiError(updateError, 'Failed to update profile'));
                setLoading(false);
            });
    }, [user, profileForm, dispatch, includePhoneField]);

    return {
        profileForm,
        isUpdated,
        error,
        loading,
        initFormFromUser,
        handleFormChange,
        handlePhotoChange,
        resetProfileState,
        submitProfile,
    };
};
