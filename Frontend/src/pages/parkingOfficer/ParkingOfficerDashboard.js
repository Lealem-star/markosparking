import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAuthSession } from '../../api/authSession';
import { PARKING_OFFICER_ROLE } from '../../constants/roles';
import { getParkingOfficerRoutePath } from '../../utils/rolePaths';
import { useRequireRole } from '../../hooks/useRequireRole';
import { useChatUnread } from '../../hooks/useChatUnread';
import { useParkingOfficerTheme } from '../../hooks/useParkingOfficerTheme';
import { useSessionUserSync } from '../../hooks/useSessionUserSync';
import DashboardShell from '../../components/layout/DashboardShell';
import {
    LayoutDashboard,
    Car,
    List,
    AlertTriangle,
    Sun,
    ChevronDown,
} from 'lucide-react';
import UserAvatar from '../../components/layout/UserAvatar';
import AppLoadingScreen from '../../components/loading/AppLoadingScreen';
import '../../styles/parkingOfficerDashboard.scss';
import '../../styles/parkingOfficerTheme.scss';

const ParkingOfficerDashboard = () => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
    const { user, isAuthorized } = useRequireRole([PARKING_OFFICER_ROLE]);
    useSessionUserSync();
    const { unreadCount, openChat } = useChatUnread(getParkingOfficerRoutePath('chat'));
    const navigate = useNavigate();
    const location = useLocation();
    const { lightMode, toggleLightMode } = useParkingOfficerTheme();

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        clearAuthSession();
        navigate('/');
    };

    const handleProfileUpdate = () => {
        navigate(getParkingOfficerRoutePath('profile'));
        setMobileMenuOpen(false);
        setMobileProfileOpen(false);
    };

    const menuItems = [
        { icon: LayoutDashboard, label: t('navigation.dashboard'), path: getParkingOfficerRoutePath('dashboard') },
        { icon: Car, label: t('valet.registerCar'), path: getParkingOfficerRoutePath('register-car') },
        { icon: List, label: t('valet.packageService'), path: getParkingOfficerRoutePath('cars') },
        { icon: AlertTriangle, label: t('valet.flaggedCustomers'), path: getParkingOfficerRoutePath('flagged-customers') },
    ];

    const bottomNavItems = [
        { icon: LayoutDashboard, label: t('navigation.dashboard'), path: getParkingOfficerRoutePath('dashboard') },
        { icon: Car, label: t('valet.mobileNavRegister'), path: getParkingOfficerRoutePath('register-car') },
        { icon: List, label: t('valet.mobileNavService'), path: getParkingOfficerRoutePath('cars') },
        { icon: AlertTriangle, label: t('valet.mobileNavFlagged'), path: getParkingOfficerRoutePath('flagged-customers') },
    ];

    const isActive = (path) => location.pathname === path;

    const renderThemeToggle = (className = '') => (
        <button
            type="button"
            className={`valet-theme-toggle ${className}`.trim()}
            onClick={toggleLightMode}
            aria-pressed={lightMode}
            aria-label={t('valet.lightMode')}
        >
            <Sun size={18} />
            <span>{t('valet.lightMode')}</span>
            <div className={`theme-switch ${lightMode ? 'theme-switch--on' : ''}`} aria-hidden="true">
                <span className="theme-switch-knob" />
            </div>
        </button>
    );

    if (!isAuthorized) {
        return <AppLoadingScreen messageKey="loadingScreen.loadingDashboard" />;
    }

    return (
        <DashboardShell
            shellClassName={`valet-dashboard ${lightMode ? '' : 'valet-dashboard--dark'}`}
            logoText="TANA PARKING"
            mobileLogoText="TANA PARKING"
            mobileSidebarLogoText="tana parking"
            menuItems={menuItems}
            isActive={isActive}
            onNavigate={navigate}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuOpenChange={setMobileMenuOpen}
            user={user}
            userDisplayName={user?.name || t('valet.valetRole')}
            profileDropdownOpen={profileDropdownOpen}
            onProfileDropdownToggle={() => setProfileDropdownOpen(!profileDropdownOpen)}
            onProfileUpdate={handleProfileUpdate}
            onLogout={handleLogout}
            unreadCount={unreadCount}
            onOpenChat={openChat}
            welcomeContent={<h1>{t('valet.welcomeBack', { name: user?.name || t('valet.valetRole') })}</h1>}
            sidebarFooterExtra={sidebarOpen ? renderThemeToggle('sidebar-theme-toggle') : null}
            mobileSidebarFooter={(
                <div className="mobile-sidebar-footer">
                    <div className="mobile-user-card-wrap">
                        <button
                            type="button"
                            className="mobile-user-card"
                            onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                        >
                            <UserAvatar user={user} className="mobile-user-avatar" />
                            <div className="mobile-user-info">
                                <span className="mobile-user-name">{user?.name || t('valet.valetRole')}</span>
                                <span className="mobile-user-role">{t('valet.valetRole')}</span>
                            </div>
                            <ChevronDown size={18} className={`mobile-user-chevron ${mobileProfileOpen ? 'open' : ''}`} />
                        </button>
                        {mobileProfileOpen && (
                            <div className="mobile-profile-menu">
                                <button type="button" onClick={handleProfileUpdate}>
                                    {t('profile.profileUpdate')}
                                </button>
                                <button type="button" className="logout-item" onClick={handleLogout}>
                                    {t('common.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                    {renderThemeToggle()}
                </div>
            )}
            footer={<footer className="valet-footer">{t('valet.footerCopyright')}</footer>}
            bottomNav={(
                <nav className="valet-bottom-nav" aria-label={t('navigation.parkingOfficerDashboard')}>
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                type="button"
                                className={`valet-bottom-nav-item ${active ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <Icon size={22} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            )}
        >
            <Outlet />
        </DashboardShell>
    );
};

export default ParkingOfficerDashboard;
