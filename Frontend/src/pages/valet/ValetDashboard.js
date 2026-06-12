import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { clearUser } from '../../reducers/userReducer';
import TanaLogo from '../../img/Tana.png';
import {
    LayoutDashboard,
    Car,
    List,
    LogOut,
    Menu,
    X,
    Bell,
    AlertTriangle,
    Sun,
    ChevronDown
} from 'lucide-react';
import { socket } from '../../utils/chatSocket';
import { useValetTheme } from '../../hooks/useValetTheme';
import '../../css/valetDashboard.scss';
import '../../css/valetTheme.scss';

const ValetDashboard = () => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { lightMode, toggleLightMode } = useValetTheme();

    useEffect(() => {
        if (!user) {
            navigate('/');
        } else if (user.type !== 'valet') {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        dispatch(clearUser());
        navigate('/');
    };

    const handleProfileUpdate = () => {
        navigate('/valet/profile');
        setMobileMenuOpen(false);
        setMobileProfileOpen(false);
    };

    useEffect(() => {
        const handleNewMessage = () => {
            if (location.pathname === '/valet/chat') return;
            setUnreadCount((prev) => prev + 1);
        };
        socket.on('chat:newMessage', handleNewMessage);
        return () => {
            socket.off('chat:newMessage', handleNewMessage);
        };
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const handleBellClick = () => {
        navigate('/valet/chat');
        setUnreadCount(0);
    };

    const menuItems = [
        { icon: LayoutDashboard, label: t('navigation.dashboard'), path: '/valet/dashboard' },
        { icon: Car, label: t('valet.registerCar'), path: '/valet/register-car' },
        { icon: List, label: t('valet.packageService'), path: '/valet/cars' },
        { icon: AlertTriangle, label: t('valet.flaggedCustomers'), path: '/valet/flagged-customers' },
    ];

    const bottomNavItems = [
        { icon: LayoutDashboard, label: t('navigation.dashboard'), path: '/valet/dashboard' },
        { icon: Car, label: t('valet.mobileNavRegister'), path: '/valet/register-car' },
        { icon: List, label: t('valet.mobileNavService'), path: '/valet/cars' },
        { icon: AlertTriangle, label: t('valet.mobileNavFlagged'), path: '/valet/flagged-customers' },
    ];

    const isActive = (path) => location.pathname === path;

    const renderUserAvatar = (className = 'user-avatar') => {
        if (user?.profilePhoto) {
            return (
                <img
                    src={user.profilePhoto.startsWith('http')
                        ? user.profilePhoto
                        : `${process.env.REACT_APP_BASE_URL || 'http://localhost:4000/'}${user.profilePhoto.startsWith('/') ? user.profilePhoto.substring(1) : user.profilePhoto}`}
                    alt="Profile"
                    className="user-avatar-img"
                />
            );
        }
        return (
            <div className={className}>
                {user?.name?.[0]?.toUpperCase()}
            </div>
        );
    };

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

    if (!user || user.type !== 'valet') {
        return null;
    }

    return (
        <div className={`valet-dashboard ${lightMode ? '' : 'valet-dashboard--dark'}`}>
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <img src={TanaLogo} alt="Logo" className="logo-img" />
                        <span className="logo-text">TANA PARKING</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileMenuOpen(false);
                                }}
                            >
                                <Icon size={20} />
                                {sidebarOpen && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {sidebarOpen && renderThemeToggle('sidebar-theme-toggle')}
                    <div className="user-profile-dropdown">
                        <button
                            className="nav-item user-profile-btn"
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        >
                            {renderUserAvatar()}
                            {sidebarOpen && (
                                <>
                                    <span className="user-name">{user?.name || 'Admin'}</span>
                                    <span className="dropdown-arrow">▼</span>
                                </>
                            )}
                        </button>
                        {profileDropdownOpen && sidebarOpen && (
                            <div className="profile-dropdown-menu">
                                <button
                                    className="dropdown-item"
                                    onClick={handleProfileUpdate}
                                >
                                    <span>{t('profile.profileUpdate')}</span>
                                </button>
                                <button
                                    className="dropdown-item logout-item"
                                    onClick={handleLogout}
                                >
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
                    <button
                        type="button"
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Menu"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="mobile-header-logo">
                        <img src={TanaLogo} alt="Tana Parking" className="mobile-header-logo-img" />
                        <span>TANA PARKING</span>
                    </div>

                    <div className="header-left">
                        <div className="welcome-message">
                            <h1>{t('valet.welcomeBack', { name: user?.name || 'Valet' })}</h1>
                        </div>
                    </div>

                    <div className="header-right">
                        <button type="button" className="icon-btn" onClick={handleBellClick} aria-label={t('navigation.chat')}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        </button>
                    </div>
                </header>

                {mobileMenuOpen && (
                    <div
                        className="mobile-overlay"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <aside
                            className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sidebar-header">
                                <div className="logo">
                                    <img src={TanaLogo} alt="Logo" className="logo-img" />
                                    <span className="logo-text">tana parking</span>
                                </div>
                                <button
                                    type="button"
                                    className="sidebar-toggle"
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-label="Close menu"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <nav className="sidebar-nav">
                                {menuItems.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={index}
                                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                            onClick={() => {
                                                navigate(item.path);
                                                setMobileMenuOpen(false);
                                            }}
                                        >
                                            <Icon size={20} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="mobile-sidebar-footer">
                                <div className="mobile-user-card-wrap">
                                    <button
                                        type="button"
                                        className="mobile-user-card"
                                        onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                                    >
                                        {renderUserAvatar('mobile-user-avatar')}
                                        <div className="mobile-user-info">
                                            <span className="mobile-user-name">{user?.name || 'Valet'}</span>
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
                        </aside>
                    </div>
                )}

                <div className="content-area">
                    <Outlet />
                </div>

                <footer className="valet-footer">
                    {t('valet.footerCopyright')}
                </footer>

                <nav className="valet-bottom-nav" aria-label="Valet navigation">
                    {bottomNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <button
                                key={index}
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
            </div>
        </div>
    );
};

export default ValetDashboard;
