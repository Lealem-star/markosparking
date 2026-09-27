import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../hooks/useAuth';
import { clearAuthSession } from '../../api/authSession';
import { isStaffShellRole, isValetRole } from '../../constants/roles';
import { getParkingOfficerRoutePath, getStaffRoutePath } from '../../utils/rolePaths';
import { Mail } from "lucide-react";
import markosLogo from '../../assets/Markos.png';
import partnerLogo from '../../assets/image.png';
import '../../styles/layout.scss';

const Layout = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    const handleLogout = () => {
        clearAuthSession();
        navigate('/');
    };

    useEffect(() => {
        if (!user && location.pathname !== '/') {
            navigate('/');
        }
    }, [user, location, navigate]);

    return (
        <div className="main-container">
            <nav className="markospark-nav">
                <div className="nav-inner">
                    <Link className="nav-brand" to="/">
                        <img src={markosLogo} alt="" className="nav-brand-icon" />
                        <span className="nav-brand-name">MarkosPark</span>
                    </Link>

                    {user && (
                        <ul className="nav-links">
                            {isStaffShellRole(user.type) && (
                                <li>
                                    <Link to={getStaffRoutePath(user.type, 'dashboard')}>{t('navigation.adminDashboard')}</Link>
                                </li>
                            )}
                            {isValetRole(user.type) && (
                                <li>
                                    <Link to={getParkingOfficerRoutePath('dashboard')}>{t('navigation.parkingOfficerDashboard')}</Link>
                                </li>
                            )}
                            <li>
                                <Link to="/profile" className="nav-profile">
                                    {user?.name?.[0]?.toUpperCase() || '?'}
                                </Link>
                            </li>
                            <li>
                                <button type="button" className="nav-logout-btn" onClick={handleLogout}>
                                    {t('common.logout')}
                                </button>
                            </li>
                        </ul>
                    )}

                    {!user && (
                        <div className="nav-partner">
                            <img
                                src={partnerLogo}
                                alt="Bahir Dar City Administration"
                                className="nav-partner-logo"
                            />
                        </div>
                    )}
                </div>
            </nav>

            <main>
                <Outlet />
            </main>

            {!isHome && (
                <footer className="markospark-footer">
                    <p>Copyright &copy; 2026 by Enqopa Technologies Plc</p>
                    <a href="mailto:enqopatechplc@gmail.com" aria-label="Email">
                        <Mail size={18} />
                    </a>
                </footer>
            )}
        </div>
    );
};

export default Layout;
