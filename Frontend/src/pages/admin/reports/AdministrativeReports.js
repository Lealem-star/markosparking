import React, { useState } from 'react';
import { useCurrentUser } from '../../../hooks/useAuth';
import { useReportQuery } from '../../../hooks/useReportQuery';
import { queryKeys } from '../../../api/queryKeys';
import { getUsersReport } from '../../../api/api';
import { Users, Download } from 'lucide-react';
import { exportAdministrativeReportToPDF } from '../../../utils/pdfExportReact';
import { partitionUsersReport } from '../../../utils/reportUtils';
import { ReportAlert } from './reportModules';
import '../../../styles/reports.scss';

const AdministrativeReports = () => {
    const user = useCurrentUser();
    const [exportError, setExportError] = useState('');

    const { data: usersData, loading, error, load: loadUsersReport } = useReportQuery(
        queryKeys.usersReport(user?.token),
        () => getUsersReport(user.token),
        { enabled: Boolean(user?.token) }
    );

    const handleExportPDF = async () => {
        try {
            if (!usersData) return;

            await exportAdministrativeReportToPDF({
                title: 'User Management Report',
                subtitle: 'Complete user listing and activity',
                data: usersData,
                filename: `user-management-${new Date().toISOString().split('T')[0]}.pdf`,
                type: 'users',
            });
        } catch (exportError) {
            console.error('Error exporting PDF:', exportError);
            setExportError('Failed to export PDF. Please try again.');
        }
    };

    const { valetUsers, administrativeUsers } = partitionUsersReport(usersData?.usersByType);

    return (
        <div className="administrative-reports">
            <ReportAlert error={error || exportError} />

            <div className="report-section">
                <div className="report-controls">
                    <button type="button" className="btn-user-management">
                        <Users size={16} />
                        User Management
                    </button>
                    <button onClick={loadUsersReport} className="btn-refresh" disabled={loading}>
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    {usersData && (
                        <button onClick={handleExportPDF} className="btn-export">
                            <Download size={16} />
                            Export PDF
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading">Loading user data...</div>
                ) : usersData ? (
                    <div className="report-content">
                        <div className="summary-section">
                            <div className="summary-card">
                                <h3>{usersData.totalUsers}</h3>
                                <p>Total officers</p>
                            </div>
                        </div>

                        {(valetUsers.length > 0 || administrativeUsers.length > 0) && (
                            <div className="report-table-section">
                                {valetUsers.length > 0 && (
                                    <div className="user-type-section">
                                        <h3>Valet ({valetUsers.length})</h3>
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Phone Number</th>
                                                    <th>Park Zone Code</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {valetUsers.map((entry, idx) => (
                                                    <tr key={idx}>
                                                        <td>{entry.name}</td>
                                                        <td>{entry.phoneNumber}</td>
                                                        <td>{entry.parkZoneCode || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {administrativeUsers.length > 0 && (
                                    <div className="user-type-section">
                                        <h3>Administrative ({administrativeUsers.length})</h3>
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Phone Number</th>
                                                    <th>Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {administrativeUsers.map((entry, idx) => (
                                                    <tr key={idx}>
                                                        <td>{entry.name}</td>
                                                        <td>{entry.phoneNumber}</td>
                                                        <td>{entry.role}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-data">Click Refresh to load user data.</div>
                )}
            </div>
        </div>
    );
};

export default AdministrativeReports;
