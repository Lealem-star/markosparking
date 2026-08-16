import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthSession } from '../../api/authSession';
import { STAFF_SHELL_ROLES } from '../../constants/roles';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useChatUnread } from '../../hooks/useChatUnread';
import { useProfileUpdate } from '../../hooks/useProfileUpdate';
import { useSessionUserSync } from '../../hooks/useSessionUserSync';
import DashboardShell from '../../components/layout/DashboardShell';
import ProfileModal from '../../components/profile/ProfileModal';
import {
    getMenuItemsForRole,
    getRoleLabelKey,
    getRoleSubtitleKey,
} from '../../config/staffAccess';
import { getRolePathPrefix, getStaffRoutePath } from '../../utils/rolePaths';
import AppLoadingScreen from '../../components/loading/AppLoadingScreen';
import { LogOut, User } from 'lucide-react';

import '../../styles/adminDashboard.scss';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const { user, isAuthorized } = useRequireRole(STAFF_SHELL_ROLES);
    useSessionUserSync();
    const navigate = useNavigate();
    const location = useLocation();
    const chatPath = getStaffRoutePath(user?.type, 'chat');
    const dashboardPath = getStaffRoutePath(user?.type, 'dashboard');
    const profilePath = getStaffRoutePath(user?.type, 'dashboard', 'profile');
    const urlPrefix = location.pathname.split('/').filter(Boolean)[0];
    const userPrefix = getRolePathPrefix(user?.type);
    const { unreadCount, openChat } = useChatUnread(chatPath);
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
    } = useProfileUpdate(user);

    const menuItems = useMemo(
        () => getMenuItemsForRole(user?.type, t),
        [user?.type, t]
    );

    const roleLabel = t(getRoleLabelKey(user?.type));
    const roleSubtitle = t(getRoleSubtitleKey(user?.type));

    useEffect(() => {
        if (location.pathname === profilePath) {
            setShowProfileModal(true);
            initFormFromUser(user);
        } else {
            setShowProfileModal(false);
        }
    }, [location.pathname, profilePath, user, initFormFromUser]);

    useEffect(() => {
        if (!userPrefix || urlPrefix === userPrefix) return;
        navigate(dashboardPath, { replace: true });
    }, [dashboardPath, navigate, urlPrefix, userPrefix]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownOpen && !event.target.closest('.user-profile-dropdown')) {
                setProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [profileDropdownOpen]);

    const handleLogout = () => {
        clearAuthSession();
        navigate('/');
        setProfileDropdownOpen(false);
    };

    const handleProfileUpdate = () => {
        navigate(profilePath);
        setProfileDropdownOpen(false);
    };

    const handleCloseProfileModal = () => {
        navigate(dashboardPath);
        setShowProfileModal(false);
        resetProfileState();
    };

    const isActive = (path) => location.pathname === path;

    if (!isAuthorized) {
        return <AppLoadingScreen messageKey="loadingScreen.loadingDashboard" />;
    }

    return (
        <>
            <DashboardShell
                shellClassName="admin-dashboard"
                logoText="tana parking"
                mobileSidebarLogoText={roleLabel}
                menuItems={menuItems}
                isActive={isActive}
                onNavigate={navigate}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                mobileMenuOpen={mobileMenuOpen}
                onMobileMenuOpenChange={setMobileMenuOpen}
                user={user}
                userDisplayName={user?.name || roleLabel}
                profileDropdownOpen={profileDropdownOpen}
                onProfileDropdownToggle={() => setProfileDropdownOpen(!profileDropdownOpen)}
                onProfileUpdate={handleProfileUpdate}
                onLogout={handleLogout}
                unreadCount={unreadCount}
                onOpenChat={openChat}
                welcomeContent={(
                    <span className="admin-welcome">
                        <span>{t('dashboard.welcome')}, {user?.name || roleLabel}</span>
                        <small className="admin-role-responsibility">{roleSubtitle}</small>
                    </span>
                )}
                mobileNavExtra={(
                    <>
                        <button
                            type="button"
                            className={`nav-item ${isActive(profilePath) ? 'active' : ''}`}
                            onClick={() => {
                                navigate(profilePath);
                                setMobileMenuOpen(false);
                            }}
                        >
                            <User size={20} />
                            <span>{t('profile.profileUpdate')}</span>
                        </button>
                        <button
                            type="button"
                            className="nav-item logout-item"
                            onClick={() => {
                                handleLogout();
                                setMobileMenuOpen(false);
                            }}
                        >
                            <LogOut size={20} />
                            <span>{t('common.logout')}</span>
                        </button>
                    </>
                )}
                overlay={(
                    <ProfileModal
                        isOpen={showProfileModal}
                        onClose={handleCloseProfileModal}
                        user={user}
                        profileForm={profileForm}
                        isUpdated={isUpdated}
                        error={error}
                        loading={loading}
                        onFormChange={handleFormChange}
                        onPhotoChange={handlePhotoChange}
                        onSubmit={() => submitProfile(t, handleCloseProfileModal)}
                        showEmailField
                    />
                )}
            >
                <Outlet />
            </DashboardShell>
        </>
    );
};

export default AdminDashboard;
