import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '../components/Toast';

// Portal Component for Modals
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const Reports = () => {
    const { showToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [currentReportType, setCurrentReportType] = useState('farmers');
    const [filters, setFilters] = useState({
        method: 'businessArea', // Default selection
        startDate: '',
        endDate: '',
        district: 'All',
        businessArea: 'All',
        instructor: 'All',
        division: 'All',
        status: 'All',
        format: 'PDF',
        reportName: ''
    });

    // Mock Data mirroring UserManagement.jsx
    const farmersData = [
        { id: 'FARM-2025-0001', name: 'Sunil Perera', email: 'sunil@example.com', district: 'Anuradhapura', location: 'Padaviya', division: 'Boganewa', instructor: 'Rohan Silva', status: 'Active' },
        { id: 'FARM-2025-0002', name: 'Kamala Fernando', email: 'kamala@example.com', district: 'Anuradhapura', location: 'Padaviya', division: 'Boganewa', instructor: 'Rohan Silva', status: 'Active' },
        { id: 'FARM-2025-0003', name: 'Nimal Rathnayake', email: 'nimal@example.com', district: 'Anuradhapura', location: 'Padaviya', division: 'Kumbukwewa', instructor: 'Rohan Silva', status: 'Active' },
        { id: 'FARM-2025-0004', name: 'Saman Kumara', email: 'saman@example.com', district: 'Anuradhapura', location: 'Padaviya', division: 'Kumbukwewa', instructor: 'Rohan Silva', status: 'Blocked' },
        { id: 'FARM-2025-0005', name: 'Ajith Weerasinghe', email: 'ajith@example.com', district: 'Anuradhapura', location: 'Padaviya', division: 'Boganewa', instructor: 'Rohan Silva', status: 'Active' },

        { id: 'FARM-2025-0006', name: 'Chitra Kumari', email: 'chitra@example.com', district: 'Anuradhapura', location: 'Rajanganaya', division: 'Yaya 1', instructor: 'Priya Bandara', status: 'Active' },
        { id: 'FARM-2025-0007', name: 'Sarath Fonseka', email: 'sarath@example.com', district: 'Anuradhapura', location: 'Rajanganaya', division: 'Yaya 1', instructor: 'Priya Bandara', status: 'Active' },
        { id: 'FARM-2025-0008', name: 'Malini De Silva', email: 'malini@example.com', district: 'Anuradhapura', location: 'Rajanganaya', division: 'Yaya 2', instructor: 'Priya Bandara', status: 'Active' },
        { id: 'FARM-2025-0009', name: 'Bandara Menike', email: 'bandara@example.com', district: 'Anuradhapura', location: 'Rajanganaya', division: 'Yaya 2', instructor: 'Priya Bandara', status: 'Active' },
        { id: 'FARM-2025-0010', name: 'Jagath Pushpakumara', email: 'jagath@example.com', district: 'Anuradhapura', location: 'Rajanganaya', division: 'Yaya 1', instructor: 'Priya Bandara', status: 'Active' },

        { id: 'FARM-2025-0011', name: 'Gunapala Herath', email: 'gunapala@example.com', district: 'Anuradhapura', location: 'Vahalkada', division: 'Track 5', instructor: 'Anura Wickramasinghe', status: 'Active' },
        { id: 'FARM-2025-0012', name: 'Siripala Gamage', email: 'siripala@example.com', district: 'Anuradhapura', location: 'Vahalkada', division: 'Track 5', instructor: 'Anura Wickramasinghe', status: 'Active' },
        { id: 'FARM-2025-0013', name: 'Chandani Liyanage', email: 'chandani@example.com', district: 'Anuradhapura', location: 'Vahalkada', division: 'Track 6', instructor: 'Anura Wickramasinghe', status: 'Active' },
        { id: 'FARM-2025-0014', name: 'Duminda Silva', email: 'duminda@example.com', district: 'Anuradhapura', location: 'Vahalkada', division: 'Track 6', instructor: 'Anura Wickramasinghe', status: 'Active' },
        { id: 'FARM-2025-0015', name: 'Mahesh Senanayake', email: 'mahesh@example.com', district: 'Anuradhapura', location: 'Vahalkada', division: 'Track 5', instructor: 'Anura Wickramasinghe', status: 'Active' },

        { id: 'FARM-2025-0016', name: 'Thilini Priyadarshani', email: 'thilini@example.com', district: 'Anuradhapura', location: 'Medawachchiya', division: 'Tulana 1', instructor: 'Kasun Jayasuriya', status: 'Active' },
        { id: 'FARM-2025-0017', name: 'Ruwan Hettiarachchi', email: 'ruwan@example.com', district: 'Anuradhapura', location: 'Medawachchiya', division: 'Tulana 1', instructor: 'Kasun Jayasuriya', status: 'Active' },
        { id: 'FARM-2025-0018', name: 'Sanath Jayasuriya', email: 'sanath@example.com', district: 'Anuradhapura', location: 'Medawachchiya', division: 'Tulana 2', instructor: 'Kasun Jayasuriya', status: 'Active' },
        { id: 'FARM-2025-0019', name: 'Upul Tharanga', email: 'upul@example.com', district: 'Anuradhapura', location: 'Medawachchiya', division: 'Tulana 2', instructor: 'Kasun Jayasuriya', status: 'Active' },
        { id: 'FARM-2025-0020', name: 'Damitha Abeyratne', email: 'damitha@example.com', district: 'Anuradhapura', location: 'Medawachchiya', division: 'Tulana 1', instructor: 'Kasun Jayasuriya', status: 'Blocked' },

        { id: 'FARM-2025-0021', name: 'Kanthi Perera', email: 'kanthi@example.com', district: 'Anuradhapura', location: 'Kebithigollewa', division: 'Handagala', instructor: 'Nimali Perera', status: 'Active' },
        { id: 'FARM-2025-0022', name: 'Nihal Fernando', email: 'nihal@example.com', district: 'Anuradhapura', location: 'Kebithigollewa', division: 'Handagala', instructor: 'Nimali Perera', status: 'Active' },
        { id: 'FARM-2025-0023', name: 'Wasantha Kumar', email: 'wasantha@example.com', district: 'Anuradhapura', location: 'Kebithigollewa', division: 'Kanugahawewa', instructor: 'Nimali Perera', status: 'Active' },
        { id: 'FARM-2025-0024', name: 'Nayana Kumari', email: 'nayana@example.com', district: 'Anuradhapura', location: 'Kebithigollewa', division: 'Kanugahawewa', instructor: 'Nimali Perera', status: 'Active' },
        { id: 'FARM-2025-0025', name: 'Ranjith Premadasa', email: 'ranjith@example.com', district: 'Anuradhapura', location: 'Kebithigollewa', division: 'Handagala', instructor: 'Nimali Perera', status: 'Active' }
    ];

    const instructorsData = [
        { id: 'INST-2026-0001', name: 'Rohan Silva', email: 'rohan@example.com', district: 'Anuradhapura', businessArea: 'Padaviya', farmersCount: 5, status: 'Active' },
        { id: 'INST-2026-0002', name: 'Priya Bandara', email: 'priya@example.com', district: 'Anuradhapura', businessArea: 'Rajanganaya', farmersCount: 5, status: 'Active' },
        { id: 'INST-2026-0003', name: 'Anura Wickramasinghe', email: 'anura@example.com', district: 'Anuradhapura', businessArea: 'Vahalkada', farmersCount: 5, status: 'Active' },
        { id: 'INST-2026-0004', name: 'Kasun Jayasuriya', email: 'kasun@example.com', district: 'Anuradhapura', businessArea: 'Medawachchiya', farmersCount: 5, status: 'Active' },
        { id: 'INST-2026-0005', name: 'Nimali Perera', email: 'nimali@example.com', district: 'Anuradhapura', businessArea: 'Kebithigollewa', farmersCount: 5, status: 'Active' }
    ];

    // Mock Data mirroring Engagement.jsx
    const engagementData = [
        { id: 'INST-2026-0001', name: 'Rohan Silva', businessArea: 'Padaviya', divisions: 'Boganewa, Kumbukwewa', farmersCount: 5, rating: 4.8 },
        { id: 'INST-2026-0002', name: 'Priya Bandara', businessArea: 'Rajanganaya', divisions: 'Yaya 1, Yaya 2', farmersCount: 5, rating: 4.5 },
        { id: 'INST-2026-0003', name: 'Anura Wickramasinghe', businessArea: 'Vahalkada', divisions: 'Track 5, Track 6', farmersCount: 5, rating: 4.2 },
        { id: 'INST-2026-0004', name: 'Kasun Jayasuriya', businessArea: 'Medawachchiya', divisions: 'Tulana 1, Tulana 2', farmersCount: 5, rating: 4.0 },
        { id: 'INST-2026-0005', name: 'Nimali Perera', businessArea: 'Kebithigollewa', divisions: 'Handagala, Kanugahawewa', farmersCount: 5, rating: 4.7 }
    ];

    // Filter Handlers
    const openFilterModal = (type) => {
        setCurrentReportType(type);
        setIsFilterModalOpen(true);
    };

    const closeFilterModal = () => {
        setIsFilterModalOpen(false);
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
        showToast(`Preparing ${currentReportType} report...`, 'info');

        // Simulate minor processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (currentReportType === 'farmers') {
            handleFarmersReport();
        } else if (currentReportType === 'instructors') {
            handleInstructorsReport();
        } else if (currentReportType === 'engagement') {
            handleEngagementReport();
        }

        setIsGenerating(false);
        showToast('Report generated successfully!', 'success');
        closeFilterModal();
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
        doc.autoTable({
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
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('AgriConnect Admin System - Confidential Report', 14, doc.internal.pageSize.height - 10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        doc.save(`${filename}.pdf`);
    };

    // Report Handlers
    const handleFarmersReport = () => {
        let filteredData = farmersData;

        // Filter by Status
        if (filters.status !== 'All') {
            filteredData = filteredData.filter(f => f.status === filters.status);
        }

        // Filter by Method
        if (filters.method === 'businessArea' && filters.businessArea !== 'All') {
            filteredData = filteredData.filter(f => f.location === filters.businessArea);
        } else if (filters.method === 'instructor' && filters.instructor !== 'All') {
            filteredData = filteredData.filter(f => f.instructor === filters.instructor);
        } else if (filters.method === 'division' && filters.division !== 'All') {
            filteredData = filteredData.filter(f => f.instructorDivision === filters.division);
        }

        const columns = ['ID', 'Name', 'Email', 'District', 'Business Area', 'Assigned Instructor', 'Status'];
        const data = filteredData.map(f => [f.id, f.name, f.email, f.district, f.location, f.instructor, f.status]);
        generatePDF('User Management Report', 'Registered Farmers List', columns, data, 'agriconnect_farmers_report');
    };

    const handleInstructorsReport = () => {
        let filteredData = instructorsData;

        // Filter by Status
        if (filters.status !== 'All') {
            filteredData = filteredData.filter(i => i.status === filters.status);
        }

        // Filter by Business Area
        if (filters.businessArea !== 'All') {
            filteredData = filteredData.filter(i => i.businessArea === filters.businessArea);
        }

        const columns = ['ID', 'Name', 'Email', 'District', 'Business Area', 'Farmers Count', 'Status'];
        const data = filteredData.map(i => [i.id, i.name, i.email, i.district, i.businessArea, i.farmersCount, i.status]);
        generatePDF('User Management Report', 'Registered Instructors List', columns, data, 'agriconnect_instructors_report');
    };

    const handleEngagementReport = () => {
        let filteredData = engagementData;

        // Filter by Business Area
        if (filters.businessArea !== 'All') {
            filteredData = filteredData.filter(e => e.businessArea === filters.businessArea);
        }

        const columns = ['Instructor ID', 'Name', 'Business Area', 'Divisions', 'Assigned Farmers', 'Avg Rating'];
        const data = filteredData.map(e => [e.id, e.name, e.businessArea, Array.isArray(e.divisions) ? e.divisions.join(', ') : e.divisions, e.farmersCount, e.rating > 0 ? e.rating : 'N/A']);
        generatePDF('Engagement Report', 'Instructor-Farmer Engagement Analysis', columns, data, 'agriconnect_engagement_report');
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
                            Comprehensive list of all registered farmers, including their business areas, assigned instructors, and account status.
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
                            Detailed report on agricultural instructors, their operating districts, business areas, and farmer assignment counts.
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
                                                <option value="businessArea">Business Area</option>
                                                <option value="instructor">Assigned Instructor</option>
                                                <option value="division">Instructor Division</option>
                                            </select>
                                        </div>

                                        {filters.method === 'businessArea' && (
                                            <div className="admin-form-group">
                                                <label>Business Area</label>
                                                <select
                                                    className="admin-form-control"
                                                    name="businessArea"
                                                    value={filters.businessArea}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">All Areas</option>
                                                    <option value="Padaviya">Padaviya</option>
                                                    <option value="Rajanganaya">Rajanganaya</option>
                                                    <option value="Vahalkada">Vahalkada</option>
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
                                                    <option value="Rohan Silva">Rohan Silva</option>
                                                    <option value="Priya Bandara">Priya Bandara</option>
                                                    <option value="Anura Wickramasinghe">Anura Wickramasinghe</option>
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
                                                    <option value="Boganewa">Boganewa</option>
                                                    <option value="Kumbukwewa">Kumbukwewa</option>
                                                    <option value="Yaya 1">Yaya 1</option>
                                                    <option value="Yaya 2">Yaya 2</option>
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {currentReportType === 'instructors' && (
                                    <div className="admin-form-group">
                                        <label>Business Area</label>
                                        <select
                                            className="admin-form-control"
                                            name="businessArea"
                                            value={filters.businessArea}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Areas</option>
                                            <option value="Padaviya">Padaviya</option>
                                            <option value="Rajanganaya">Rajanganaya</option>
                                            <option value="Vahalkada">Vahalkada</option>
                                        </select>
                                    </div>
                                )}

                                {currentReportType === 'engagement' && (
                                    <div className="admin-form-group">
                                        <label>Business Area</label>
                                        <select
                                            className="admin-form-control"
                                            name="businessArea"
                                            value={filters.businessArea}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Areas</option>
                                            <option value="Padaviya">Padaviya</option>
                                            <option value="Rajanganaya">Rajanganaya</option>
                                            <option value="Vahalkada">Vahalkada</option>
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
                                                    <label>Business Area</label>
                                                    <select
                                                        className="admin-form-control"
                                                        name="businessArea"
                                                        value={filters.businessArea}
                                                        onChange={handleFilterChange}
                                                    >
                                                        <option value="All">All Areas</option>
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
                                        {['farmers', 'instructors', 'engagement'].includes(currentReportType) ? (
                                            <div className="pdf-format-label">
                                                <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i> PDF Document
                                            </div>
                                        ) : (
                                            <>
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
                                                        value="Excel"
                                                        checked={filters.format === 'Excel'}
                                                        onChange={handleFilterChange}
                                                    />
                                                    <i className="fas fa-file-excel" style={{ color: '#27ae60' }}></i> Excel Spreadsheet
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="admin-modal-footer">
                                    <button className="btn btn-secondary" onClick={closeFilterModal} disabled={isGenerating}>Cancel</button>
                                    <button className="btn btn-send" onClick={handleGenerateReport} disabled={isGenerating}>
                                        {isGenerating ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                                        ) : (
                                            <><i className="fas fa-file-pdf"></i> Generate & Download</>
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
