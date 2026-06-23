import { useTranslation } from 'react-i18next';
import { X, User, Camera } from 'lucide-react';

const ProfileModal = ({
    isOpen,
    onClose,
    user,
    profileForm,
    isUpdated,
    error,
    loading,
    onFormChange,
    onPhotoChange,
    onSubmit,
    showPhoneField = false,
    showEmailField = false,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="profile-modal-header">
                    <h2>{t('profile.updateProfile')}</h2>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="profile-modal-body">
                    {isUpdated && (
                        <div className="alert alert-success">
                            {t('profile.profileUpdatedSuccessfully')}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <div className="profile-photo-section">
                        <div className="profile-photo-preview">
                            {profileForm.profilePhotoPreview ? (
                                <img
                                    src={profileForm.profilePhotoPreview}
                                    alt="Profile"
                                    className="profile-photo-img"
                                />
                            ) : (
                                <div className="profile-photo-placeholder">
                                    <User size={48} />
                                </div>
                            )}
                            <label className="profile-photo-upload-btn">
                                <Camera size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => onPhotoChange(e.target.files?.[0])}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        <p className="profile-photo-hint">{t('profile.clickCameraToUpload')}</p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="profile-name">{t('profile.name')}</label>
                        <input
                            type="text"
                            id="profile-name"
                            className="form-control"
                            value={profileForm.name}
                            onChange={(e) => onFormChange('name', e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    {showPhoneField && (
                        <div className="form-group">
                            <label htmlFor="profile-phone">{t('profile.phoneNumber')}</label>
                            <input
                                type="text"
                                id="profile-phone"
                                className="form-control"
                                value={profileForm.phoneNumber}
                                onChange={(e) => onFormChange('phoneNumber', e.target.value)}
                                placeholder="Enter your phone number"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="profile-language">{t('profile.language')}</label>
                        <select
                            id="profile-language"
                            className="form-control"
                            value={profileForm.language}
                            onChange={(e) => onFormChange('language', e.target.value)}
                        >
                            <option value="en">{t('profile.english')}</option>
                            <option value="am">{t('profile.amharic')}</option>
                        </select>
                    </div>

                    {showEmailField && (
                        <div className="form-group">
                            <label htmlFor="profile-email">{t('profile.email')}</label>
                            <input
                                type="email"
                                id="profile-email"
                                className="form-control"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                    )}

                    <div className="password-section">
                        <h3>{t('profile.changePassword')}</h3>
                        <div className="form-group">
                            <label htmlFor="profile-password">{t('profile.newPassword')}</label>
                            <input
                                type="password"
                                id="profile-password"
                                className="form-control"
                                value={profileForm.password}
                                onChange={(e) => onFormChange('password', e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profile-confirm-password">{t('profile.confirmPassword')}</label>
                            <input
                                type="password"
                                id="profile-confirm-password"
                                className="form-control"
                                value={profileForm.confirmPassword}
                                onChange={(e) => onFormChange('confirmPassword', e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="profile-modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            {t('common.cancel')}
                        </button>
                        <button type="button" className="btn-submit" onClick={onSubmit} disabled={loading}>
                            {loading ? t('profile.updating') : t('profile.updateProfile')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
