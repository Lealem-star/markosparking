import React from 'react';
import '../../styles/appLoadingScreen.scss';

const DashboardContentLoader = () => (
    <div className="dashboard-content-loader" aria-hidden="true">
        <div className="dashboard-content-loader__stats">
            <div className="dashboard-content-loader__card" />
            <div className="dashboard-content-loader__card" />
        </div>
        <div className="dashboard-content-loader__panel">
            <div className="dashboard-content-loader__line dashboard-content-loader__line--short" />
            <div className="dashboard-content-loader__line dashboard-content-loader__line--medium" />
            <div className="dashboard-content-loader__line" />
            <div className="dashboard-content-loader__line" />
            <div className="dashboard-content-loader__line dashboard-content-loader__line--medium" />
        </div>
    </div>
);

export default DashboardContentLoader;
