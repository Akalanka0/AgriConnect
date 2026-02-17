import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useOutletContext } from 'react-router-dom';

// Portal Component for Modals
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(children, document.body);
};

const InstructorReports = () => {
    const { showToast } = useOutletContext();
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [currentReportType, setCurrentReportType] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [divisions, setDivisions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'All',
        division: 'All',
        format: 'PDF'
    });

    // Fetch instructor profile to get actual divisions
    useEffect(() => {
        const fetchInstructorProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/instructor/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success && result.data.assigned_divisions) {
                    setDivisions(result.data.assigned_divisions);
                }
            } catch (error) {
                console.error('Error fetching instructor profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInstructorProfile();
    }, []);

    const [reportHistory, setReportHistory] = useState([]);

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

    const generatePDF = (title, subtitle, columns, data, filename) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(21, 101, 192); // #1565c0 - Primary Blue
        doc.text('AgriConnect', 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(100);
        doc.text(title, 14, 30);

        doc.setFontSize(12);
        doc.setTextColor(128);
        doc.text(subtitle, 14, 38);

        // Filter info in PDF
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Duration: ${filters.startDate || 'N/A'} to ${filters.endDate || 'N/A'}`, 14, 46);
        doc.text(`Status: ${filters.status} | Division: ${filters.division}`, 14, 52);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 58);

        // Table
        autoTable(doc, {
            startY: 65,
            head: [columns],
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [21, 101, 192], textColor: 255 },
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
            doc.text('AgriConnect Instructor System - Confidential Report', 14, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        }

        doc.save(`${filename}.pdf`);

        // Add to history
        const newEntry = {
            id: Date.now(),
            category: currentReportType,
            name: `${currentReportType} Report - ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString().split('T')[0],
            status: 'Success'
        };
        setReportHistory(prev => [newEntry, ...prev]);
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

        // Add to history
        const newEntry = {
            id: Date.now(),
            category: currentReportType,
            name: `${currentReportType} Report (CSV) - ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString().split('T')[0],
            status: 'Success'
        };
        setReportHistory(prev => [newEntry, ...prev]);
    };

    const handleGenerateReport = async () => {
        // Validation
        if (filters.startDate && filters.endDate) {
            if (new Date(filters.startDate) > new Date(filters.endDate)) {
                showToast('Start date cannot be after end date', 'error');
                return;
            }
        }

        setIsGenerating(true);
        showToast(`Generating ${currentReportType} report...`, 'info');

        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                type: currentReportType,
                startDate: filters.startDate,
                endDate: filters.endDate,
                status: filters.status,
                division: filters.division
            }).toString();

            const response = await fetch(`/api/instructor/reports?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const { columns, rows } = result.data;
                const filename = `${currentReportType.toLowerCase().replace(' ', '_')}_report_${new Date().toISOString().split('T')[0]}`;

                if (filters.format === 'CSV') {
                    generateCSV(columns, rows, filename);
                } else {
                    generatePDF(
                        `${currentReportType} Report`,
                        `Detailed analysis for selected duration and filters`,
                        columns,
                        rows,
                        filename
                    );
                }
                showToast('Report generated successfully!', 'success');
                closeFilterModal();
            } else {
                showToast(result.error?.message || 'Failed to generate report', 'error');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showToast('An error occurred while generating the report', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <div className="dashboard-grid">
                {/* Pest Management Report Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Pest Management</div>
                        <div className="card-icon"><i className="fas fa-bug"></i></div>
                    </div>
                    <div className="card-content">
                        <p className="card-description-text" style={{ minHeight: '60px' }}>
                            Comprehensive report on pest and disease incidents reported by farmers and their review status across your assigned divisions.
                        </p>
                        <button 
                            className="btn btn-primary btn-full-width" 
                            onClick={() => openFilterModal('Pest Management')}
                        >
                            <i className="fas fa-download"></i> Download Report
                        </button>
                    </div>
                </div>

                {/* Crop Plan Report Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Crop Plans</div>
                        <div className="card-icon"><i className="fas fa-seedling"></i></div>
                    </div>
                    <div className="card-content">
                        <p className="card-description-text" style={{ minHeight: '60px' }}>
                            Detailed summary of seasonal crop cultivation plans submitted for review and approval by farmers in your business area.
                        </p>
                        <button 
                            className="btn btn-primary btn-full-width" 
                            onClick={() => openFilterModal('Crop Plans')}
                        >
                            <i className="fas fa-download"></i> Download Report
                        </button>
                    </div>
                </div>

                {/* Meetings Report Card */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Meetings</div>
                        <div className="card-icon"><i className="fas fa-calendar-check"></i></div>
                    </div>
                    <div className="card-content">
                        <p className="card-description-text" style={{ minHeight: '60px' }}>
                            Analysis of consultation requests and finalized meetings with farmers, including scheduling trends and engagement levels.
                        </p>
                        <button 
                            className="btn btn-primary btn-full-width" 
                            onClick={() => openFilterModal('Meetings')}
                        >
                            <i className="fas fa-download"></i> Download Report
                        </button>
                    </div>
                </div>
            </div>

            {/* History Table in a Card */}
            <div className="card card-margin-top">
                <div className="card-header">
                    <div className="card-title">Recent Report Generation History</div>
                    <div className="card-icon"><i className="fas fa-history"></i></div>
                </div>
                <div className="card-content">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Report Name</th>
                                    <th>Generated On</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportHistory.map(report => (
                                    <tr key={report.id}>
                                        <td>{report.category}</td>
                                        <td>{report.name}</td>
                                        <td>{report.date}</td>
                                        <td>
                                            <span className="status-badge status-completed">
                                                {report.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <ModalPortal>
                    <div className="theme-instructor">
                        <div className="instructor-modal" style={{ display: 'flex' }}>
                            <div className="instructor-modal-content">
                                <div className="instructor-modal-header">
                                    <div className="instructor-modal-title">Generate {currentReportType} Report</div>
                                    <span className="instructor-close" onClick={closeFilterModal}>&times;</span>
                                </div>
                                <div className="instructor-modal-body">
                                    <p className="card-description-text">
                                        Select the criteria for your agricultural report.
                                    </p>

                                    <div className="instructor-modal-grid">
                                        <div className="form-group">
                                            <label>Start Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="startDate"
                                                value={filters.startDate}
                                                onChange={handleFilterChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="endDate"
                                                value={filters.endDate}
                                                onChange={handleFilterChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Status Type</label>
                                        <select
                                            className="form-control"
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Pending">Pending Review</option>
                                            <option value="In_progress">In Progress</option>
                                            <option value="Resolved">Resolved / Completed</option>
                                            <option value="Declined">Declined / Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Instructor's Division</label>
                                        <select
                                            className="form-control"
                                            name="division"
                                            value={filters.division}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">All Divisions</option>
                                            {divisions.map(div => (
                                                <option key={div} value={div}>{div}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Report Format</label>
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                            <label className="format-radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="format"
                                                    value="PDF"
                                                    checked={filters.format === 'PDF'}
                                                    onChange={handleFilterChange}
                                                />
                                                <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i> PDF
                                            </label>
                                            <label className="format-radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="format"
                                                    value="CSV"
                                                    checked={filters.format === 'CSV'}
                                                    onChange={handleFilterChange}
                                                />
                                                <i className="fas fa-file-csv" style={{ color: '#27ae60' }}></i> CSV
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="instructor-modal-footer">
                                    <button className="btn btn-secondary" onClick={closeFilterModal}>Cancel</button>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleGenerateReport}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? 'Generating...' : `Generate ${filters.format} Report`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </>
    );
};

export default InstructorReports;


