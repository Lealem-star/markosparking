import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { clearUser } from '../../store';
import { ADMIN_ROLES } from '../../constants/roles';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useChatUnread } from '../../hooks/useChatUnread';
import { useProfileUpdate } from '../../hooks/useProfileUpdate';
import DashboardShell from '../../components/layout/DashboardShell';
import ProfileModal from '../../components/profile/ProfileModal';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    User,
    FileText,
    AlertTriangle,
} from 'lucide-react';

import '../../styles/adminDashboard.scss';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const { user, isAuthorized } = useRequireRole(ADMIN_ROLES);
    const { unreadCount, openChat } = useChatUnread('/admin/chat');
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
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

    useEffect(() => {
        if (location.pathname === '/admin/dashboard/profile') {
            setShowProfileModal(true);
            initFormFromUser(user);
        } else {
            setShowProfileModal(false);
        }
    }, [location.pathname, user, initFormFromUser]);

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
        dispatch(clearUser());
        navigate('/');
        setProfileDropdownOpen(false);
    };

    const handleProfileUpdate = () => {
        navigate('/admin/dashboard/profile');
        setProfileDropdownOpen(false);
    };

    const handleCloseProfileModal = () => {
        navigate('/admin/dashboard');
        setShowProfileModal(false);
        resetProfileState();
    };

    const menuItems = [
        { icon: LayoutDashboard, label: t('navigation.dashboard'), path: '/admin/dashboard' },
        { icon: Users, label: t('admin.userManagement'), path: '/admin/users' },
        { icon: FileText, label: t('navigation.reports'), path: '/admin/reports' },
        { icon: Settings, label: t('navigation.settings'), path: '/admin/settings' },
        { icon: AlertTriangle, label: t('valet.flaggedCustomers'), path: '/admin/flagged-customers' },
    ];

    const isActive = (path) => location.pathname === path;

    if (!isAuthorized) {
        return null;
    }

    const mobileRoleLabel = user?.type === 'system_admin'
        ? 'System Admin'
        : (user?.type === 'admin' ? 'Admin' : 'Manager');

    return (
        <>
            <DashboardShell
                shellClassName="admin-dashboard"
                logoText="tana parking"
                mobileSidebarLogoText={mobileRoleLabel}
                menuItems={menuItems}
                isActive={isActive}
                onNavigate={navigate}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                mobileMenuOpen={mobileMenuOpen}
                onMobileMenuOpenChange={setMobileMenuOpen}
                user={user}
                userDisplayName={user?.name || 'Admin'}
                profileDropdownOpen={profileDropdownOpen}
                onProfileDropdownToggle={() => setProfileDropdownOpen(!profileDropdownOpen)}
                onProfileUpdate={handleProfileUpdate}
                onLogout={handleLogout}
                unreadCount={unreadCount}
                onOpenChat={openChat}
                welcomeContent={<span>{t('dashboard.welcome')}, {user?.name || 'Admin'}</span>}
                mobileNavExtra={(
                    <>
                        <button
                            type="button"
                            className={`nav-item ${isActive('/admin/dashboard/profile') ? 'active' : ''}`}
                            onClick={() => {
                                navigate('/admin/dashboard/profile');
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
