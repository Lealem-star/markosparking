import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchParkedCars, updateParkedCar } from '../../api/api';
import { Car, CheckCircle, Calendar, Package } from 'lucide-react';
import '../../css/valetOverview.scss';

// Helper to calculate package end date based on duration
    const calculateEndDate = (parkedAt, packageDuration) => {
        const startDate = new Date(parkedAt);
        let endDate = new Date(startDate);
        
        switch (packageDuration) {
            case 'weekly':
                endDate.setDate(startDate.getDate() + 7);
                break;
            case 'monthly':
                endDate.setMonth(startDate.getMonth() + 1);
                break;
            case 'yearly':
                endDate.setFullYear(startDate.getFullYear() + 1);
                break;
            default:
                return null;
        }
        
        return endDate;
    };

const ValetOverview = () => {
    const { t } = useTranslation();
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [packageStats, setPackageStats] = useState({
        weekly: 0,
        monthly: 0,
        yearly: 0,
        currentlyParked: 0
    });
    const [packageServices, setPackageServices] = useState([]);
    const [parkInLoadingId, setParkInLoadingId] = useState(null); // subscription key being processed
    const [error, setError] = useState(null);

    const loadPackageServices = useCallback(() => {
        if (user?.token) {
            fetchParkedCars({ 
                token: user.token, 
                setParkedCars: (cars) => {
                    // Filter package services
                    const packageCars = cars.filter(car => car.serviceType === 'package');

                    // Group by subscription (packageSubscriptionId or fallback licensePlate)
                    const now = new Date();
                    const subscriptionMap = {};

                    packageCars.forEach(car => {
                        const subKey = car.packageSubscriptionId || `lp-${car.licensePlate}`;

                        // Determine end date (from packageEndDate if present, else calculate from first parkedAt)
                        let packageEndDate = car.packageEndDate
                            ? new Date(car.packageEndDate)
                            : calculateEndDate(car.parkedAt, car.packageDuration);

                        // Skip expired packages
                        if (!packageEndDate || packageEndDate <= now) {
                            return;
                        }

                        if (!subscriptionMap[subKey]) {
                            subscriptionMap[subKey] = {
                                key: subKey,
                                cars: [],
                                packageDuration: car.packageDuration,
                                phoneNumber: car.phoneNumber,
                                packageEndDate,
                            };
                        }

                        subscriptionMap[subKey].cars.push(car);
                    });

                    const activeSubscriptions = Object.values(subscriptionMap).map(sub => {
                        const isCurrentlyParked = sub.cars.some(c => c.status === 'parked');
                        const checkedOutCars = sub.cars.filter(c => c.status === 'checked_out');
                        const lastCheckedOutRecord = checkedOutCars.length > 0
                            ? checkedOutCars.sort((a, b) => new Date(b.checkedOutAt || 0) - new Date(a.checkedOutAt || 0))[0]
                            : null;
                        const licensePlate = (sub.cars[0] && (sub.cars[0].licensePlate || `${sub.cars[0].plateCode || ''}-${sub.cars[0].region || ''}-${sub.cars[0].licensePlateNumber || ''}`)) || 'N/A';
                        return {
                            ...sub,
                            isCurrentlyParked,
                            lastCheckedOutRecord,
                            licensePlate
                        };
                    });

                    // Calculate stats from active subscriptions
                    const weekly = activeSubscriptions.filter(s => s.packageDuration === 'weekly').length;
                    const monthly = activeSubscriptions.filter(s => s.packageDuration === 'monthly').length;
                    const yearly = activeSubscriptions.filter(s => s.packageDuration === 'yearly').length;
                    const currentlyParked = packageCars.filter(car => car.status === 'parked').length;

                    setPackageStats({ weekly, monthly, yearly, currentlyParked });

                    // Sort subscriptions by end date desc
                    const sortedSubscriptions = activeSubscriptions.sort(
                        (a, b) => b.packageEndDate - a.packageEndDate
                    );

                    setPackageServices(sortedSubscriptions);
                }
            });
        }
    }, [user]);

    useEffect(() => {
        loadPackageServices();
    }, [loadPackageServices]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleParkIn = (sub) => {
        if (!sub.lastCheckedOutRecord || !user?.token) return;
        setError(null);
        setParkInLoadingId(sub.key);
        updateParkedCar({
            id: sub.lastCheckedOutRecord._id,
            body: { status: 'parked' },
            token: user.token,
            handleUpdateParkedCarSuccess: () => {
                setParkInLoadingId(null);
                loadPackageServices();
            },
            handleUpdateParkedCarFailure: (err) => {
                setParkInLoadingId(null);
                setError(err || 'Failed to park in. Please try again.');
            }
        });
    };

    return (
        <div className="valet-overview">
            <div className="quick-actions">
                <button 
                    className="action-btn primary"
                    onClick={() => navigate('/valet/register-car')}
                >
                    <Car size={20} />
                    Register New Car
                </button>
                <button 
                    className="action-btn secondary"
                    onClick={() => navigate('/valet/cars')}
                >
                    <CheckCircle size={20} />
                    View All Cars
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><Calendar size={14} /></div>
                    <div className="stat-content">
                        <h3>{packageStats.weekly}</h3>
                        <p>Weekly Registered</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Calendar size={14} /></div>
                    <div className="stat-content">
                        <h3>{packageStats.monthly}</h3>
                        <p>Monthly Registered</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Calendar size={14} /></div>
                    <div className="stat-content">
                        <h3>{packageStats.yearly}</h3>
                        <p>Yearly Registered</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Package size={14} /></div>
                    <div className="stat-content">
                        <h3>{packageStats.currentlyParked}</h3>
                        <p>Currently Parked (Package)</p>
                    </div>
                </div>
            </div>

            {/* Package Services List */}
            <div className="historical-stats-section">
                <h2>Package Service Registrations</h2>
                {error && (
                    <div className="package-error-banner" role="alert">
                        {error}
                        <button type="button" onClick={() => setError(null)} aria-label="Dismiss">×</button>
                    </div>
                )}
                {packageServices.length > 0 ? (
                    <div className="stats-table-container">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>License Plate</th>
                                    <th>Phone</th>
                                    <th>Package Type</th>
                                    <th>End Date</th>
                                    <th>Total Visits</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packageServices.map((sub) => {
                                    const packageType = sub.packageDuration
                                        ? sub.packageDuration.charAt(0).toUpperCase() + sub.packageDuration.slice(1)
                                        : 'N/A';
                                    const visitsCount = sub.cars.length;
                                    const now = new Date();
                                    const isExpired = sub.packageEndDate && sub.packageEndDate <= now;
                                    const canParkIn = !sub.isCurrentlyParked && sub.lastCheckedOutRecord && !isExpired;
                                    const loading = parkInLoadingId === sub.key;

                                    return (
                                        <tr key={sub.key}>
                                            <td>{sub.licensePlate}</td>
                                            <td>{sub.phoneNumber || 'N/A'}</td>
                                            <td>{packageType}</td>
                                            <td>{sub.packageEndDate ? formatDateTime(sub.packageEndDate) : 'N/A'}</td>
                                            <td>{visitsCount}</td>
                                            <td>
                                                <span className={`package-status-badge ${sub.isCurrentlyParked ? 'parked' : 'checked-out'}`}>
                                                    {sub.isCurrentlyParked ? t('valet.parked') : t('valet.checkedOut')}
                                                </span>
                                            </td>
                                            <td>
                                                {canParkIn && (
                                                    <button
                                                        type="button"
                                                        className="btn-park-in"
                                                        onClick={() => handleParkIn(sub)}
                                                        disabled={loading}
                                                    >
                                                        {loading ? t('common.loading') : t('valet.parkIn')}
                                                    </button>
                                                )}
                                                {isExpired && !sub.isCurrentlyParked && (
                                                    <span className="package-expired-label">Expired</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-stats-message">
                        <p>No package service registrations available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValetOverview;

