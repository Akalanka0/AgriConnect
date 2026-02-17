import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../components/Toast';

// Portal Component for Modals
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Reports = () => {
    // Helper to format zone names (remove "Zone" suffix if present)
    const formatZoneName = (name) => {
        if (!name) return '-';
        // More robust removal: handle trailing spaces and case-insensitive "Zone"
        return name.toString().replace(/\s+Zone\s*$/i, '').trim();
    };

    const { showToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const abortControllerRef = useRef(false);

    const [currentReportType, setCurrentReportType] = useState('farmers');
    const [filters, setFilters] = useState({
        method: 'zone', // Default selection
        startDate: '',
        endDate: '',
        district: 'All',
        zone: 'All',
        instructor: 'All',
        division: 'All',
        status: 'All',
        format: 'PDF',
        reportName: ''
    });

    // Mock Data mirroring UserManagement.jsx
    const farmersData = [
        { id: 'FARM-2025-0001', name: 'Sunil Perera', email: 'sunil@example.com', district: 'Anuradhapura', location: formatZoneName('Nuwaragam Palatha'), division: 'Nuwaragam Palatha Central', instructor: 'Chamara Perera', status: 'Active' },
        { id: 'FARM-2025-0002', name: 'Kamala Fernando', email: 'kamala@example.com', district: 'Anuradhapura', location: formatZoneName('Nuwaragam Palatha'), division: 'Nuwaragam Palatha Central', instructor: 'Chamara Perera', status: 'Active' },
        { id: 'FARM-2025-0003', name: 'Nimal Rathnayake', email: 'nimal@example.com', district: 'Anuradhapura', location: formatZoneName('Nuwaragam Palatha'), division: 'Nuwaragam Palatha East', instructor: 'Chamara Perera', status: 'Active' },
        { id: 'FARM-2025-0004', name: 'Saman Kumara', email: 'saman@example.com', district: 'Anuradhapura', location: formatZoneName('Nuwaragam Palatha'), division: 'Nuwaragam Palatha East', instructor: 'Chamara Perera', status: 'Blocked' },
        { id: 'FARM-2025-0005', name: 'Ajith Weerasinghe', email: 'ajith@example.com', district: 'Anuradhapura', location: formatZoneName('Nuwaragam Palatha'), division: 'Mihintale', instructor: 'Chamara Perera', status: 'Active' },

        { id: 'FARM-2025-0006', name: 'Chitra Kumari', email: 'chitra@example.com', district: 'Anuradhapura', location: formatZoneName('Kekirawa'), division: 'Kekirawa', instructor: 'Ruwan Silva', status: 'Active' },
        { id: 'FARM-2025-0007', name: 'Sarath Fonseka', email: 'sarath@example.com', district: 'Anuradhapura', location: formatZoneName('Kekirawa'), division: 'Ipalogama', instructor: 'Ruwan Silva', status: 'Active' },
        { id: 'FARM-2025-0008', name: 'Malini De Silva', email: 'malini@example.com', district: 'Anuradhapura', location: formatZoneName('Kekirawa'), division: 'Palagala', instructor: 'Ruwan Silva', status: 'Active' },
        { id: 'FARM-2025-0009', name: 'Bandara Menike', email: 'bandara@example.com', district: 'Anuradhapura', location: formatZoneName('Kekirawa'), division: 'Thirappane', instructor: 'Kumari Dissanayake', status: 'Active' },
        { id: 'FARM-2025-0010', name: 'Jagath Pushpakumara', email: 'jagath@example.com', district: 'Anuradhapura', location: formatZoneName('Kekirawa'), division: 'Maradankadawala', instructor: 'Kumari Dissanayake', status: 'Active' },

        { id: 'FARM-2025-0011', name: 'Gunapala Herath', email: 'gunapala@example.com', district: 'Anuradhapura', location: formatZoneName('Huruluwewa'), division: 'Galenbindunuwewa', instructor: 'Pradeep Bandara', status: 'Active' },
        { id: 'FARM-2025-0012', name: 'Siripala Gamage', email: 'siripala@example.com', district: 'Anuradhapura', location: formatZoneName('Huruluwewa'), division: 'Kahatagasdigiliya', instructor: 'Pradeep Bandara', status: 'Active' },
        { id: 'FARM-2025-0013', name: 'Chandani Liyanage', email: 'chandani@example.com', district: 'Anuradhapura', location: formatZoneName('Huruluwewa'), division: 'Horowpothana', instructor: 'Pradeep Bandara', status: 'Active' },
        { id: 'FARM-2025-0014', name: 'Duminda Silva', email: 'duminda@example.com', district: 'Anuradhapura', location: formatZoneName('Huruluwewa'), division: 'Kebithigollewa', instructor: 'Tharindu Rajapaksa', status: 'Active' },
        { id: 'FARM-2025-0015', name: 'Mahesh Senanayake', email: 'mahesh@example.com', district: 'Anuradhapura', location: formatZoneName('Huruluwewa'), division: 'Padaviya', instructor: 'Tharindu Rajapaksa', status: 'Active' },

        { id: 'FARM-2025-0016', name: 'Thilini Priyadarshani', email: 'thilini@example.com', district: 'Anuradhapura', location: formatZoneName('Medawachchiya'), division: 'Medawachchiya', instructor: 'Sunil Hettiarachchi', status: 'Active' },
        { id: 'FARM-2025-0017', name: 'Ruwan Hettiarachchi', email: 'ruwan@example.com', district: 'Anuradhapura', location: formatZoneName('Medawachchiya'), division: 'Kanadara', instructor: 'Sunil Hettiarachchi', status: 'Active' },
        { id: 'FARM-2025-0018', name: 'Sanath Jayasuriya', email: 'sanath@example.com', district: 'Anuradhapura', location: formatZoneName('Medawachchiya'), division: 'Medawachchiya', instructor: 'Sunil Hettiarachchi', status: 'Active' }
    ];

    const instructorsData = [
        { id: 'INST-2026-0001', name: 'Chamara Perera', email: 'chamara@example.com', district: 'Anuradhapura', zone: formatZoneName('Nuwaragam Palatha'), farmersCount: 5, status: 'Active' },
        { id: 'INST-2026-0002', name: 'Nimali Jayasinghe', email: 'nimali.j@example.com', district: 'Anuradhapura', zone: formatZoneName('Nuwaragam Palatha'), farmersCount: 0, status: 'Active' },
        { id: 'INST-2026-0003', name: 'Ruwan Silva', email: 'ruwan@example.com', district: 'Anuradhapura', zone: formatZoneName('Kekirawa'), farmersCount: 3, status: 'Active' },
        { id: 'INST-2026-0004', name: 'Kumari Dissanayake', email: 'kumari@example.com', district: 'Anuradhapura', zone: formatZoneName('Kekirawa'), farmersCount: 2, status: 'Active' },
        { id: 'INST-2026-0005', name: 'Pradeep Bandara', email: 'pradeep@example.com', district: 'Anuradhapura', zone: formatZoneName('Huruluwewa'), farmersCount: 3, status: 'Active' },
        { id: 'INST-2026-0006', name: 'Tharindu Rajapaksa', email: 'tharindu@example.com', district: 'Anuradhapura', zone: formatZoneName('Huruluwewa'), farmersCount: 2, status: 'Active' },
        { id: 'INST-2026-0007', name: 'Sunil Hettiarachchi', email: 'sunil.h@example.com', district: 'Anuradhapura', zone: formatZoneName('Medawachchiya'), farmersCount: 3, status: 'Active' }
    ];

    // Mock Data mirroring Engagement.jsx
    const engagementData = [
        { id: 'INST-2026-0001', name: 'Chamara Perera', zone: formatZoneName('Nuwaragam Palatha'), divisions: 'Central, East, Mihintale', farmersCount: 5, rating: 4.8 },
        { id: 'INST-2026-0003', name: 'Ruwan Silva', zone: formatZoneName('Kekirawa'), divisions: 'Kekirawa, Ipalogama, Palagala', farmersCount: 3, rating: 4.5 },
        { id: 'INST-2026-0005', name: 'Pradeep Bandara', zone: formatZoneName('Huruluwewa'), divisions: 'Galenbindunuwewa, Kahatagasdigiliya, Horowpothana', farmersCount: 3, rating: 4.2 },
        { id: 'INST-2026-0007', name: 'Sunil Hettiarachchi', zone: formatZoneName('Medawachchiya'), divisions: 'Medawachchiya, Kanadara', farmersCount: 3, rating: 4.7 }
    ];

    // Filter Handlers
    const openFilterModal = (type) => {
        setCurrentReportType(type);
        setIsFilterModalOpen(true);
    };

    const closeFilterModal = () => {
        if (isGenerating) {
            handleCancelGeneration();
        }
        setIsFilterModalOpen(false);
    };

    const handleCancelGeneration = () => {
        abortControllerRef.current = true;
        setIsGenerating(false);
        showToast('Report generation cancelled', 'info');
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateReport = async () => {
        // Validation for date range if dates are provided
        if (filters.startDate && filters.endDate) {
            if (new Date(filters.startDate) > new Date(filters.endDate)) {
                showToast('Start date cannot be after end date', 'error');
                return;
            }
        }

        setIsGenerating(true);
        abortControllerRef.current = false;
        showToast(`Preparing ${currentReportType} report...`, 'info');

        // Simulate a small delay to allow cancellation
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (abortControllerRef.current) return;

        try {
            if (currentReportType === 'farmers') {
                handleFarmersReport();
            } else if (currentReportType === 'instructors') {
                handleInstructorsReport();
            } else if (currentReportType === 'engagement') {
                handleEngagementReport();
            }

            if (!abortControllerRef.current) {
                showToast('Report generated successfully!', 'success');
                setIsFilterModalOpen(false);
            }
        } catch (error) {
            if (!abortControllerRef.current) {
                showToast('Error generating report', 'error');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // PDF Generation Function
    const generatePDF = (title, subtitle, columns, data, filename) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(93, 64, 55); // #5d4037 - Primary Brown
        doc.text('AgriConnect', 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(100);
        doc.text(title, 14, 30);

        doc.setFontSize(12);
        doc.setTextColor(128);
        doc.text(subtitle, 14, 38);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 46);

        // Table
        autoTable(doc, {
            startY: 55,
            head: [columns],
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [93, 64, 55], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            styles: { fontSize: 10, cellPadding: 3 },
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('AgriConnect Admin System - Confidential Report', 14, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        }

        doc.save(`${filename}.pdf`);
    };

    const generateCSV = (columns, data, filename) => {
        const csvContent = [
            columns.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Report Handlers
    const handleFarmersReport = () => {
        let filteredData = farmersData;

        // Filter by Status
        if (filters.status !== 'All') {
            filteredData = filteredData.filter(f => f.status === filters.status);
        }

        // Filter by Method
        if (filters.method === 'zone' && filters.zone !== 'All') {
            filteredData = filteredData.filter(f => f.location === filters.zone);
        } else if (filters.method === 'instructor' && filters.instructor !== 'All') {
            filteredData = filteredData.filter(f => f.instructor === filters.instructor);
        } else if (filters.method === 'division' && filters.division !== 'All') {
            filteredData = filteredData.filter(f => f.division === filters.division);
        }

        const columns = ['ID', 'Name', 'Email', 'District', 'Zone', 'Assigned Instructor', 'Status'];
        const data = filteredData.map(f => [f.id, f.name, f.email, f.district, f.location, f.instructor, f.status]);
        const filename = filters.reportName ? filters.reportName.replace(/\s+/g, '_').toLowerCase() : 'agriconnect_farmers_report';
        
        if (filters.format === 'CSV') {
            generateCSV(columns, data, filename);
        } else {
            generatePDF('User Management Report', 'Registered Farmers List', columns, data, filename);
        }
    };

    const handleInstructorsReport = () => {
        let filteredData = instructorsData;

        // Filter by Status
        if (filters.status !== 'All') {
            filteredData = filteredData.filter(i => i.status === filters.status);
        }

        // Filter by Zone
        if (filters.zone !== 'All') {
            filteredData = filteredData.filter(i => i.zone === filters.zone);
        }

        const columns = ['ID', 'Name', 'Email', 'District', 'Zone', 'Farmers Count', 'Status'];
        const data = filteredData.map(i => [i.id, i.name, i.email, i.district, i.zone, i.farmersCount, i.status]);
        const filename = filters.reportName ? filters.reportName.replace(/\s+/g, '_').toLowerCase() : 'agriconnect_instructors_report';
        
        if (filters.format === 'CSV') {
            generateCSV(columns, data, filename);
        } else {
            generatePDF('User Management Report', 'Registered Instructors List', columns, data, filename);
        }
    };

    const handleEngagementReport = () => {
        let filteredData = engagementData;

        // Filter by Zone
        if (filters.zone !== 'All') {
            filteredData = filteredData.filter(e => e.zone === filters.zone);
        }

        const columns = ['Instructor ID', 'Name', 'Zone', 'Divisions', 'Assigned Farmers', 'Avg Rating'];
        const data = filteredData.map(e => [e.id, e.name, e.zone, Array.isArray(e.divisions) ? e.divisions.join(', ') : e.divisions, e.farmersCount, e.rating > 0 ? e.rating : 'N/A']);
        const filename = filters.reportName ? filters.reportName.replace(/\s+/g, '_').toLowerCase() : 'agriconnect_engagement_report';
        
        if (filters.format === 'CSV') {
            generateCSV(columns, data, filename);
        } else {
            generatePDF('Engagement Report', 'Instructor-Farmer Engagement Analysis', columns, data, filename);
        }
    };

    return (
        <div className="page active" id="reports">
            <div className="page-title">
                <i className="fas fa-file-alt"></i>
                <h2>Reports</h2>
            </div>

            <div className="dashboard-grid">
                {/* User Management: Farmers */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">User Management: Farmers</div>
                        <div className="card-icon"><i className="fas fa-users"></i></div>
                    </div>
                    <div className="card-content">
                        <p className="card-description-text">
                            Comprehensive list of all registered farmers, including their zones, assigned instructors, and account status.
                        </p>

                        <button className="btn btn-primary btn-full-width" onClick={() => openFilterModal('farmers')}>
                            <i className="fas fa-download"></i> Download Farmers Report
                        </button>
                    </div>
                </div>

                {/* User Management: Instructors */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">User Management: Instructors</div>
                        <div className="card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                    </div>
                    <div className="card-content">
                        <p className="card-description-text">
                            Detailed report on agricultural instructors, their operating districts, zones, and farmer assignment counts.
                        </p>

                        <button className="btn btn-primary btn-full-width" onClick={() => openFilterModal('instructors')}>
                            <i className="fas fa-download"></i> Download Instructors Report
                        </button>
                    </div>
                </div>

                {/* Engagement Report */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Instructor-Farmer Engagement</div>
                        <div className="card-icon"><i className="fas fa-handshake"></i></div>
                    </div>
                    <div className="card-content">
                        <p className="card-description-text">
                            Analysis of instructor performance, including farmer assignment loads, covered divisions, and farmer ratings.
                        </p>

                        <button className="btn btn-primary btn-full-width" onClick={() => openFilterModal('engagement')}>
                            <i className="fas fa-download"></i> Download Engagement Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="card card-margin-top">
                <div className="card-header">
                    <div className="card-title">Report Generation History</div>
                    <div className="card-icon"><i className="fas fa-history"></i></div>
                </div>
                <div className="card-content">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Report Category</th>
                                    <th>Report Name</th>
                                    <th>Generated On</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>User Management: Farmers</td>
                                    <td>Farmers List Q4</td>
                                    <td>2023-10-28</td>
                                    <td><span className="status-badge status-resolved">Success</span></td>
                                </tr>
                                <tr>
                                    <td>Instructor-Farmer Engagement</td>
                                    <td>Monthly Performance</td>
                                    <td>2023-10-25</td>
                                    <td><span className="status-badge status-resolved">Success</span></td>
                                </tr>
                                <tr>
                                    <td>User Management: Instructors</td>
                                    <td>Instructors Audit</td>
                                    <td>2023-10-15</td>
                                    <td><span className="status-badge status-resolved">Success</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <ModalPortal>
                    <div className="admin-modal active modal-flex-center" id="reportFilterModal">
                        <div className="admin-modal-content modal-width-medium">
                            <div className="admin-modal-header">
                                <div className="admin-modal-title">Generate Report</div>
                                <button className="admin-modal-close-round" onClick={closeFilterModal}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="admin-modal-body">
                                <p className="filter-description">
                                    Select filters for <strong>{currentReportType === 'farmers' ? 'Farmers' : currentReportType === 'instructors' ? 'Instructors' : 'Engagement'}</strong> report.
                                </p>

                                <div className="admin-form-group">
                                    <label>Report Name</label>
                                    <input
                                        type="text"
                                        className="admin-form-control"
                                        name="reportName"
                                        value={filters.reportName}
                                        onChange={handleFilterChange}
                                        placeholder="Enter report name"
                                    />
                                </div>

                                {currentReportType === 'farmers' && (
                                    <>
                                        <div className="admin-form-group">
                                            <label>Select Method</label>
                                            <select
                                                className="admin-form-control select-margin-bottom"
                                                name="method"
                                                value={filters.method}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="zone">Zone</option>
                                                <option value="instructor">Assigned Instructor</option>
                                                <option value="division">Instructor Division</option>
                                            </select>
                                        </div>

                                        {filters.method === 'zone' && (
                                            <div className="admin-form-group">
                                                <label>Zone</label>
                                                <select
                                                    className="admin-form-control"
                                                    name="zone"
                                                    value={filters.zone}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">All Zones</option>
                                                    {[...new Set(farmersData.map(f => f.location))].sort().map(zone => (
                                                        <option key={zone} value={zone}>{zone}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {filters.method === 'instructor' && (
                                            <div className="admin-form-group">
                                                <label>Assigned Instructor</label>
                                                <select
                                                    className="admin-form-control"
                                                    name="instructor"
                                                    value={filters.instructor}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">All Instructors</option>
                                                    {[...new Set(farmersData.map(f => f.instructor))].sort().map(inst => (
                                                        <option key={inst} value={inst}>{inst}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {filters.method === 'division' && (
                                            <div className="admin-form-group">
                                                <label>Instructor Division</label>
                                                <select
                                                    className="admin-form-control"
                                                    name="division"
                                                    value={filters.division}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">All Divisions</option>
                                                    {[...new Set(farmersData.map(f => f.division))].sort().map(div => (
                                                        <option key={div} value={div}>{div}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {currentReportType === 'instructors' && (
                                    <div className="admin-form-group">
                                        <label>Zone</label>
                                        <select
                                            className="admin-form-control"
                                            name="zone"
                                            value={filters.zone}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Zones</option>
                                            {[...new Set(instructorsData.map(i => i.zone))].sort().map(zone => (
                                                <option key={zone} value={zone}>{zone}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentReportType === 'engagement' && (
                                    <div className="admin-form-group">
                                        <label>Zone</label>
                                        <select
                                            className="admin-form-control"
                                            name="zone"
                                            value={filters.zone}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Zones</option>
                                            {[...new Set(engagementData.map(e => e.zone))].sort().map(zone => (
                                                <option key={zone} value={zone}>{zone}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentReportType !== 'farmers' && currentReportType !== 'instructors' && currentReportType !== 'engagement' && (
                                    <>
                                        <div className="admin-form-group">
                                            <label>Date Range</label>
                                            <div className="date-range-grid">
                                                <div>
                                                    <span className="date-label">Start Date</span>
                                                    <input
                                                        type="date"
                                                        className="admin-form-control"
                                                        name="startDate"
                                                        value={filters.startDate}
                                                        onChange={handleFilterChange}
                                                    />
                                                </div>
                                                <div>
                                                    <span className="date-label">End Date</span>
                                                    <input
                                                        type="date"
                                                        className="admin-form-control"
                                                        name="endDate"
                                                        value={filters.endDate}
                                                        onChange={handleFilterChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="admin-form-group">
                                            <div className="district-area-grid">
                                                <div>
                                                    <label>District</label>
                                                    <select
                                                        className="admin-form-control"
                                                        name="district"
                                                        value={filters.district}
                                                        onChange={handleFilterChange}
                                                    >
                                                        <option value="All">All Districts</option>
                                                        <option value="Anuradhapura">Anuradhapura</option>
                                                        <option value="Polonnaruwa">Polonnaruwa</option>
                                                        <option value="Kurunegala">Kurunegala</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label>Zone</label>
                                                    <select
                                                        className="admin-form-control"
                                                        name="zone"
                                                        value={filters.zone}
                                                        onChange={handleFilterChange}
                                                    >
                                                        <option value="All">All Zones</option>
                                                        <option value="Padaviya">Padaviya</option>
                                                        <option value="Rajanganaya">Rajanganaya</option>
                                                        <option value="Vahalkada">Vahalkada</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {currentReportType !== 'engagement' && (
                                    <div className="admin-form-group">
                                        <label>Status</label>
                                        <select
                                            className="admin-form-control"
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Active">Active</option>
                                            <option value="Blocked">Blocked</option>
                                            <option value="Deleted">Deleted</option>
                                        </select>
                                    </div>
                                )}

                                <div className="admin-form-group">
                                    <label>Export Format</label>
                                    <div className="export-format-group">
                                        <label className="format-radio-label">
                                            <input
                                                type="radio"
                                                name="format"
                                                value="PDF"
                                                checked={filters.format === 'PDF'}
                                                onChange={handleFilterChange}
                                            />
                                            <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i> PDF Document
                                        </label>
                                        <label className="format-radio-label">
                                            <input
                                                type="radio"
                                                name="format"
                                                value="CSV"
                                                checked={filters.format === 'CSV'}
                                                onChange={handleFilterChange}
                                            />
                                            <i className="fas fa-file-excel" style={{ color: '#27ae60' }}></i> CSV Spreadsheet
                                        </label>
                                    </div>
                                </div>

                                <div className="admin-modal-footer">
                                    <button 
                                        className={`btn ${isGenerating ? 'btn-danger' : 'btn-secondary'}`} 
                                        onClick={closeFilterModal}
                                    >
                                        {isGenerating ? 'Stop Generation' : 'Cancel'}
                                    </button>
                                    <button className="btn btn-send" onClick={handleGenerateReport} disabled={isGenerating}>
                                        {isGenerating ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                                        ) : (
                                            <><i className={filters.format === 'PDF' ? "fas fa-file-pdf" : "fas fa-file-excel"}></i> Generate & Download</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Reports;
