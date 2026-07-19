import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import tanaLogo from '../../assets/Tana.png';
import '../../styles/appLoadingScreen.scss';

const CAR_TYPES = ['tripod', 'automobile', 'truck', 'trailer', 'special_vehicles'];

const renderVehicleSvg = (type) => {
    switch (type) {
        case 'truck':
            return (
                <svg className="app-loader-vehicle-svg" viewBox="0 0 120 50" aria-hidden="true">
                    <rect x="5" y="10" width="70" height="25" rx="4" />
                    <path d="M78 18 h18 l10 10 v7 h-28 z" />
                    <rect className="app-loader-window" x="85" y="21" width="10" height="7" rx="1.5" />
                    <circle className="app-loader-wheel" cx="25" cy="38" r="6" />
                    <circle className="app-loader-wheel" cx="60" cy="38" r="6" />
                    <circle className="app-loader-wheel" cx="92" cy="38" r="6" />
                </svg>
            );
        case 'trailer':
            return (
                <svg className="app-loader-vehicle-svg" viewBox="0 0 160 50" aria-hidden="true">
                    <rect x="5" y="10" width="85" height="25" rx="4" />
                    <rect x="92" y="27" width="10" height="3" rx="1.5" />
                    <path d="M105 18 h18 l10 10 v7 h-28 z" />
                    <rect className="app-loader-window" x="112" y="21" width="10" height="7" rx="1.5" />
                    <circle className="app-loader-wheel" cx="25" cy="38" r="6" />
                    <circle className="app-loader-wheel" cx="70" cy="38" r="6" />
                    <circle className="app-loader-wheel" cx="125" cy="38" r="6" />
                </svg>
            );
        case 'tripod':
            return (
                <svg className="app-loader-vehicle-svg" viewBox="0 0 120 50" aria-hidden="true">
                    <path d="M30 30 h25 l10 -10 h15 l8 8 h-12 l-8 8 h-20 z" />
                    <rect className="app-loader-window" x="66" y="17" width="10" height="6" rx="1.5" />
                    <circle className="app-loader-wheel" cx="35" cy="38" r="6" />
                    <circle className="app-loader-wheel" cx="85" cy="38" r="6" />
                </svg>
            );
        default:
            return (
                <svg className="app-loader-vehicle-svg" viewBox="0 0 120 50" aria-hidden="true">
                    <path d="M20 30 h70 l10 0 c6 0 10 4 10 8 v2 H20 v-2 c0-4 3-8 10-8z" />
                    <path d="M35 30 l10-10 h30 l12 10 z" />
                    <path className="app-loader-window" d="M48 22 h12 l6 6 H44 z" />
                    <path className="app-loader-window" d="M68 22 h12 l6 6 H64 z" />
                    <circle className="app-loader-wheel" cx="40" cy="40" r="6" />
                    <circle className="app-loader-wheel" cx="85" cy="40" r="6" />
                </svg>
            );
    }
};

const AppLoadingScreen = ({ messageKey = 'loadingScreen.preparingWorkspace' }) => {
    const { t } = useTranslation();

    const cars = useMemo(() => {
        const lanes = [
            { id: 0, direction: 'right', top: 72 },
            { id: 1, direction: 'left', top: 78 },
            { id: 2, direction: 'right', top: 84 },
            { id: 3, direction: 'left', top: 90 },
        ];

        const carArray = [];
        lanes.forEach((lane) => {
            for (let i = 0; i < 3; i += 1) {
                carArray.push({
                    id: lane.id * 10 + i,
                    type: CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)],
                    delay: i * 2.4 + Math.random(),
                    duration: 9 + Math.random() * 4,
                    direction: lane.direction,
                    top: lane.top + (Math.random() * 2 - 1),
                });
            }
        });
        return carArray;
    }, []);

    return (
        <div className="app-loading-screen" role="status" aria-live="polite" aria-busy="true">
            <div className="app-loader-road-glow" aria-hidden="true" />
            <div className="app-loader-cars" aria-hidden="true">
                {cars.map((car) => (
                    <div
                        key={car.id}
                        className={`app-loader-car app-loader-car--${car.type} app-loader-car--${car.direction}`}
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

            <div className="app-loader-content">
                <div className="app-loader-logo-wrap">
                    <img src={tanaLogo} alt="" className="app-loader-logo" />
                    <span className="app-loader-ring" aria-hidden="true" />
                </div>

                <h1 className="app-loader-title">{t('loadingScreen.title')}</h1>
                <p className="app-loader-tagline">{t('splash.tagline')}</p>

                <div className="app-loader-progress" aria-hidden="true">
                    <span className="app-loader-progress-bar" />
                </div>

                <p className="app-loader-message">{t(messageKey)}</p>
            </div>
        </div>
    );
};

export default AppLoadingScreen;
