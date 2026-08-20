import React, { useState } from 'react';

import { useCurrentUser } from '../../../hooks/useAuth';

import { useReportQuery } from '../../../hooks/useReportQuery';

import { queryKeys } from '../../../api/queryKeys';

import { getVehicleHistoryReport } from '../../../api/api';

import { Car, Search, Download } from 'lucide-react';

import { formatReportCurrency } from '../../../utils/reportUtils';

import { ReportAlert } from './reportModules';

import '../../../styles/reports.scss';



const CustomerReports = () => {

    const user = useCurrentUser();

    const [activeReport, setActiveReport] = useState('vehicle-history');

    const [licensePlate, setLicensePlate] = useState('');

    const [phoneNumber, setPhoneNumber] = useState('');

    const [searchParams, setSearchParams] = useState(null);

    const [clientError, setClientError] = useState('');



    const { data: vehicleHistoryData, loading, error } = useReportQuery(

        queryKeys.vehicleHistory(user?.token, searchParams),

        () => getVehicleHistoryReport(user.token, searchParams),

        { enabled: Boolean(user?.token && searchParams) }

    );



    const handleSearch = () => {

        if (!licensePlate && !phoneNumber) {

            setClientError('Please enter license plate or phone number');

            return;

        }



        setClientError('');

        setSearchParams({

            licensePlate: licensePlate || undefined,

            phoneNumber: phoneNumber || undefined,

        });

    };



    const handleExportPDF = async () => {

        try {

            if (!vehicleHistoryData) return;



            const { exportCustomerReportToPDF } = await import('../../../utils/pdfExportReact');
            await exportCustomerReportToPDF({

                title: 'Vehicle History Report',

                subtitle: licensePlate

                    ? `License Plate: ${licensePlate}`

                    : (phoneNumber ? `Phone: ${phoneNumber}` : ''),

                data: vehicleHistoryData,

                filename: `vehicle-history-${licensePlate || phoneNumber || 'search'}.pdf`,

                type: 'vehicle-history',

            });

        } catch (exportError) {

            console.error('Error exporting PDF:', exportError);

            setClientError('Failed to export PDF. Please try again.');

        }

    };



    return (

        <div className="customer-reports">

            <div className="report-tabs">

                <button

                    className={activeReport === 'vehicle-history' ? 'active' : ''}

                    onClick={() => setActiveReport('vehicle-history')}

                >

                    <Car size={18} />

                    Vehicle History

                </button>

            </div>



            <ReportAlert error={error || clientError} />



            {activeReport === 'vehicle-history' && (

                <div className="report-section">

                    <div className="report-header">

                        <h2>Vehicle History Report</h2>

                        {vehicleHistoryData && (

                            <div className="report-controls">

                                <button onClick={handleExportPDF} className="btn-export">

                                    <Download size={16} />

                                    Export PDF

                                </button>

                            </div>

                        )}

                    </div>



                    <div className="search-section">

                        <div className="search-inputs">

                            <input

                                type="text"

                                placeholder="License Plate (e.g., 01-AA-12345)"

                                value={licensePlate}

                                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}

                                className="search-input"

                            />

                            <span>OR</span>

                            <input

                                type="text"

                                placeholder="Phone Number"

                                value={phoneNumber}

                                onChange={(e) => setPhoneNumber(e.target.value)}

                                className="search-input"

                            />

                            <button onClick={handleSearch} className="btn-search" disabled={loading}>

                                <Search size={16} />

                                {loading ? 'Searching...' : 'Search'}

                            </button>

                        </div>

                    </div>



                    {loading ? (

                        <div className="loading">Loading vehicle history...</div>

                    ) : vehicleHistoryData ? (

                        <div className="report-content">

                            <div className="summary-section">

                                <div className="summary-card">

                                    <h3>{vehicleHistoryData.totalVisits}</h3>

                                    <p>Total Visits</p>

                                </div>

                                <div className="summary-card">

                                    <h3>{formatReportCurrency(vehicleHistoryData.totalPaid)}</h3>

                                    <p>Total Paid</p>

                                </div>

                                <div className="summary-card">

                                    <h3>{formatReportCurrency(vehicleHistoryData.averagePayment)}</h3>

                                    <p>Average Payment</p>

                                </div>

                            </div>



                            {vehicleHistoryData.history?.length > 0 ? (

                                <div className="report-table-section">

                                    <h3>Parking History</h3>

                                    <table className="report-table">

                                        <thead>

                                            <tr>

                                                <th>Date Parked</th>

                                                <th>Date Checked Out</th>

                                                <th>License Plate</th>

                                                <th>Model</th>

                                                <th>Location</th>

                                                <th>Status</th>

                                                <th>Payment Method</th>

                                                <th>Amount Paid</th>

                                                <th>Duration</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {vehicleHistoryData.history.map((item, idx) => (

                                                <tr key={idx}>

                                                    <td>{new Date(item.parkedAt).toLocaleString()}</td>

                                                    <td>{item.checkedOutAt ? new Date(item.checkedOutAt).toLocaleString() : 'N/A'}</td>

                                                    <td>{item.licensePlate}</td>

                                                    <td>{item.model}</td>

                                                    <td>{item.location}</td>

                                                    <td>

                                                        <span className={`status-badge ${item.status}`}>

                                                            {item.status}

                                                        </span>

                                                    </td>

                                                    <td>{item.paymentMethod || 'manual'}</td>

                                                    <td>{formatReportCurrency(item.totalPaidAmount)}</td>

                                                    <td>{item.duration || 'N/A'}</td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                            ) : (

                                <div className="no-data">No history found for this vehicle.</div>

                            )}

                        </div>

                    ) : (

                        <div className="no-data">Enter license plate or phone number and click Search.</div>

                    )}

                </div>

            )}

        </div>

    );

};



export default CustomerReports;

