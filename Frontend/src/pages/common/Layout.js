import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { clearUser } from "../../reducers/userReducer";
import { Mail } from "lucide-react";
import tanaLogo from '../../img/Tana.png';
import partnerLogo from '../../img/image.png';
import '../../css/layout.scss';

const Layout = () => {
    const { t } = useTranslation();
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const isHome = location.pathname === '/';

    const handleLogout = () => {
        dispatch(clearUser());
        navigate('/');
    };

    useEffect(() => {
        if (!user && location.pathname !== '/') {
            navigate('/');
        }
    }, [user, location, navigate]);

    return (
        <div className="main-container">
            <nav className="tanapark-nav">
                <div className="nav-inner">
                    <Link className="nav-brand" to="/">
                        <img src={tanaLogo} alt="" className="nav-brand-icon" />
                        <span className="nav-brand-name">TanaPark</span>
                    </Link>

                    {user && (
                        <ul className="nav-links">
                            {(user.type === 'system_admin' || user.type === 'manager') && (
                                <li>
                                    <Link to="/admin/dashboard">{t('navigation.adminDashboard')}</Link>
                                </li>
                            )}
                            {user.type === 'valet' && (
                                <li>
                                    <Link to="/valet/dashboard">{t('navigation.valetDashboard')}</Link>
                                </li>
                            )}
                            {user.type === 'admin' && (
                                <li>
                                    <Link to="/users">{t('navigation.users')}</Link>
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
                <footer className="tanapark-footer">
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
