import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../../api/api';
import { getApiError } from '../../api/client';
import { setUser } from '../../store';
import { getDashboardPathForUser } from '../../utils/authRouting';
import markosLogo from '../../assets/Markos.png';
import '../../styles/home.scss';
import '../../styles/splashScreen.scss';

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderVehicleSvg = (type) => {
    switch (type) {
      case 'truck':
        return (
          <svg className="vehicle-svg" viewBox="0 0 120 50" aria-hidden="true">
            <rect x="5" y="10" width="70" height="25" rx="4" />
            <path d="M78 18 h18 l10 10 v7 h-28 z" />
            <rect className="vehicle-window" x="85" y="21" width="10" height="7" rx="1.5" />
            <circle className="vehicle-wheel" cx="25" cy="38" r="6" />
            <circle className="vehicle-wheel" cx="60" cy="38" r="6" />
            <circle className="vehicle-wheel" cx="92" cy="38" r="6" />
          </svg>
        );
      case 'trailer':
        return (
          <svg className="vehicle-svg" viewBox="0 0 160 50" aria-hidden="true">
            <rect x="5" y="10" width="85" height="25" rx="4" />
            <rect x="92" y="27" width="10" height="3" rx="1.5" />
            <path d="M105 18 h18 l10 10 v7 h-28 z" />
            <rect className="vehicle-window" x="112" y="21" width="10" height="7" rx="1.5" />
            <circle className="vehicle-wheel" cx="25" cy="38" r="6" />
            <circle className="vehicle-wheel" cx="70" cy="38" r="6" />
            <circle className="vehicle-wheel" cx="125" cy="38" r="6" />
          </svg>
        );
      case 'tripod':
        return (
          <svg className="vehicle-svg" viewBox="0 0 120 50" aria-hidden="true">
            <path d="M30 30 h25 l10 -10 h15 l8 8 h-12 l-8 8 h-20 z" />
            <rect className="vehicle-window" x="66" y="17" width="10" height="6" rx="1.5" />
            <circle className="vehicle-wheel" cx="35" cy="38" r="6" />
            <circle className="vehicle-wheel" cx="85" cy="38" r="6" />
          </svg>
        );
      case 'special_vehicles':
      case 'automobile':
      default:
        return (
          <svg className="vehicle-svg" viewBox="0 0 120 50" aria-hidden="true">
            <path d="M20 30 h70 l10 0 c6 0 10 4 10 8 v2 H20 v-2 c0-4 3-8 10-8z" />
            <path d="M35 30 l10-10 h30 l12 10 z" />
            <path className="vehicle-window" d="M48 22 h12 l6 6 H44 z" />
            <path className="vehicle-window" d="M68 22 h12 l6 6 H64 z" />
            <circle className="vehicle-wheel" cx="40" cy="40" r="6" />
            <circle className="vehicle-wheel" cx="85" cy="40" r="6" />
          </svg>
        );
    }
  };

  const carTypes = ['tripod', 'automobile', 'truck', 'trailer', 'special_vehicles'];
  const [cars] = useState(() => {
    const lanes = [
      { id: 0, direction: 'right', top: 68 },
      { id: 1, direction: 'left', top: 74 },
      { id: 2, direction: 'right', top: 80 },
      { id: 3, direction: 'left', top: 86 },
    ];

    const carArray = [];
    lanes.forEach((lane) => {
      const carsInLane = 4;
      for (let i = 0; i < carsInLane; i++) {
        carArray.push({
          id: lane.id * 10 + i,
          type: carTypes[Math.floor(Math.random() * carTypes.length)],
          delay: i * 2 + Math.random(),
          duration: 10 + Math.random() * 3,
          direction: lane.direction,
          top: lane.top + (Math.random() * 2 - 1),
        });
      }
    });
    return carArray;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await loginUser({ phoneNumber, password });
      dispatch(setUser({ ...data?.user, token: data?.token }));
      navigate(getDashboardPathForUser(data?.user));
    } catch (err) {
      setError(getApiError(err, t('auth.failedToLogin')));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home-splash">
      <div className="cars-container">
        {cars.map((car) => (
          <div
            key={car.id}
            className={`car car-${car.type} car-${car.direction}`}
            style={{
              top: `${car.top}%`,
              animationDelay: `${car.delay}s`,
              animationDuration: `${car.duration}s`,
            }}
          >
            {renderVehicleSvg(car.type)}
          </div>
        ))}
      </div>

      <div className="home-content">
        <div className="home-hero">
          <img src={markosLogo} alt="MarkosPark" className="home-hero-logo" />
          <h1 className="home-hero-title">{t('splash.welcomeTitle')}</h1>
          <p className="home-hero-subtitle">{t('splash.tagline')}</p>
        </div>

        <div className="login-card">
          <h2 className="login-card-title">{t('splash.signInToAccount')}</h2>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <User size={18} className="login-field-icon" />
              <input
                type="text"
                className="login-input"
                placeholder={t('auth.phoneNumber')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <Lock size={18} className="login-field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t('splash.rememberMe')}
              </label>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.login')}
            </button>
          </form>
        </div>

        <div className="home-credits">
          <p>{t('splash.poweredBy')}</p>
          <p>{t('splash.developedBy')}</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
