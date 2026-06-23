import { Menu, X, Bell, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TanaLogo from '../../assets/Tana.png';
import UserAvatar from './UserAvatar';

const DashboardShell = ({
    shellClassName = '',
    logoText = 'tana parking',
    mobileLogoText,
    mobileSidebarLogoText,
    menuItems = [],
    isActive,
    onNavigate,
    sidebarOpen,
    onToggleSidebar,
    mobileMenuOpen,
    onMobileMenuOpenChange,
    user,
    userDisplayName,
    profileDropdownOpen,
    onProfileDropdownToggle,
    onProfileUpdate,
    onLogout,
    unreadCount = 0,
    onOpenChat,
    welcomeContent,
    sidebarFooterExtra,
    mobileNavExtra,
    mobileSidebarFooter,
    footer,
    bottomNav,
    overlay,
    children,
}) => {
    const { t } = useTranslation();
    const displayName = userDisplayName || user?.name || 'User';
    const resolvedMobileLogoText = mobileLogoText || logoText;
    const resolvedMobileSidebarLogoText = mobileSidebarLogoText || resolvedMobileLogoText;

    const closeMobileMenu = () => onMobileMenuOpenChange(false);

    const handleNavigate = (path) => {
        onNavigate(path);
        closeMobileMenu();
    };

    return (
        <div className={shellClassName}>
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <img src={TanaLogo} alt="Logo" className="logo-img" />
                        <span className="logo-text">{logoText}</span>
                    </div>
                    <button type="button" className="sidebar-toggle" onClick={onToggleSidebar}>
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                type="button"
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                onClick={() => handleNavigate(item.path)}
                            >
                                <Icon size={20} />
                                {sidebarOpen && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {sidebarFooterExtra}
                    <div className="user-profile-dropdown">
                        <button
                            type="button"
                            className="nav-item user-profile-btn"
                            onClick={onProfileDropdownToggle}
                        >
                            <UserAvatar user={user} />
                            {sidebarOpen && (
                                <>
                                    <span className="user-name">{displayName}</span>
                                    <span className="dropdown-arrow">▼</span>
                                </>
                            )}
                        </button>
                        {profileDropdownOpen && sidebarOpen && (
                            <div className="profile-dropdown-menu">
                                <button type="button" className="dropdown-item" onClick={onProfileUpdate}>
                                    <span>{t('profile.profileUpdate')}</span>
                                </button>
                                <button type="button" className="dropdown-item logout-item" onClick={onLogout}>
                                    <LogOut size={16} />
                                    <span>{t('common.logout')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <div className="main-content">
                <header className="dashboard-header">
                    {mobileLogoText ? (
                        <>
                            <button
                                type="button"
                                className="mobile-menu-btn"
                                onClick={() => onMobileMenuOpenChange(!mobileMenuOpen)}
                                aria-label="Menu"
                            >
                                <Menu size={22} />
                            </button>
                            <div className="mobile-header-logo">
                                <img src={TanaLogo} alt="Tana Parking" className="mobile-header-logo-img" />
                                <span>{mobileLogoText}</span>
                            </div>
                            <div className="header-left">
                                <div className="welcome-message">{welcomeContent}</div>
                            </div>
                        </>
                    ) : (
                        <div className="header-left">
                            <button
                                type="button"
                                className="mobile-menu-btn"
                                onClick={() => onMobileMenuOpenChange(!mobileMenuOpen)}
                            >
                                <Menu size={24} />
                            </button>
                            <div className="welcome-message">{welcomeContent}</div>
                        </div>
                    )}

                    <div className="header-right">
                        <button type="button" className="icon-btn" onClick={onOpenChat}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        </button>
                    </div>
                </header>

                {mobileMenuOpen && (
                    <div className="mobile-overlay" onClick={closeMobileMenu}>
                        <aside
                            className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sidebar-header">
                                <div className="logo">
                                    <img src={TanaLogo} alt="Logo" className="logo-img" />
                                    <span className="logo-text">{resolvedMobileSidebarLogoText}</span>
                                </div>
                                <button type="button" className="sidebar-toggle" onClick={closeMobileMenu}>
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="sidebar-nav">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.path}
                                            type="button"
                                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                            onClick={() => handleNavigate(item.path)}
                                        >
                                            <Icon size={20} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                                {mobileNavExtra}
                            </nav>

                            {mobileSidebarFooter}
                        </aside>
                    </div>
                )}

                <div className="content-area">{children}</div>
                {footer}
                {bottomNav}
            </div>
            {overlay}
        </div>
    );
};

export default DashboardShell;
