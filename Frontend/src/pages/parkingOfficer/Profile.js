import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../hooks/useAuth';
import { useProfileUpdate } from '../../hooks/useProfileUpdate';
import ProfileModal from '../../components/profile/ProfileModal';
import { getParkingOfficerRoutePath } from '../../utils/rolePaths';
import '../../styles/parkingOfficerDashboard.scss';

const Profile = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const navigate = useNavigate();
    const {
        profileForm,
        isUpdated,
        error,
        loading,
        initFormFromUser,
        handleFormChange,
        handlePhotoChange,
        resetProfileState,
        submitProfile,
    } = useProfileUpdate(user, { includePhoneField: true });

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        initFormFromUser(user);
    }, [user, navigate, initFormFromUser]);

    const handleCloseProfileModal = () => {
        navigate(getParkingOfficerRoutePath('dashboard'));
        resetProfileState();
    };

    return (
        <div className="valet-dashboard">
            <ProfileModal
                isOpen
                onClose={handleCloseProfileModal}
                user={user}
                profileForm={profileForm}
                isUpdated={isUpdated}
                error={error}
                loading={loading}
                onFormChange={handleFormChange}
                onPhotoChange={handlePhotoChange}
                onSubmit={() => submitProfile(t, handleCloseProfileModal)}
                showPhoneField
            />
        </div>
    );
};

export default Profile;
