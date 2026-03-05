import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '@/services/adminService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import styles from '../styles/Reports.module.css';

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

    const { showToast } = useOutletContext();
    const { t } = useTranslation('admin');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const cancelledRef = useRef(false);

    const [currentReportType, setCurrentReportType] = useState('farmers');
    const [filters, setFilters] = useState({
        method: 'zone', // Default selection
        zone: 'All',
        instructor: 'All',
        division: 'All',
        status: 'All',
        format: 'PDF',
        reportName: ''
    });

    const [reportHistory, setReportHistory] = useState([]);

    // Dynamic filter data loaded from API
    const [instructorsList, setInstructorsList] = useState([]);
    const [regionHierarchy, setRegionHierarchy] = useState({});

    // Load report history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('agriconnect_report_history');
        if (savedHistory) {
            try {
                setReportHistory(JSON.parse(savedHistory));
            } catch (err) {
                console.error('Error loading report history:', err);
            }
        }
    }, []);

    // Load real zone / division / instructor data for filter dropdowns
    useEffect(() => {
        const loadFilterData = async () => {
            try {
                const [instrRes, hierRes] = await Promise.all([
                    adminAPI.getUsers('?role=instructor&limit=500'),
                    adminAPI.getRegionHierarchy()
                ]);
                if (instrRes?.data) setInstructorsList(instrRes.data);
                if (hierRes?.data) setRegionHierarchy(hierRes.data);
            } catch (err) {
                console.error('Failed to load filter data for reports:', err);
            }
        };
        loadFilterData();
    }, []);

    // Derive zone and division lists from region hierarchy
    const zonesList = Object.keys(regionHierarchy);
    const divisionsList = zonesList.flatMap(z => regionHierarchy[z] || []);

    // NOTE: Mock data removed - Reports now fetch real data from API
    // API endpoints used:
    // - GET /api/admin/users?role=farmer&limit=1000  (Farmers Data)
    // - GET /api/admin/users?role=instructor&limit=1000  (Instructors Data)
    // - GET /api/admin/engagement?limit=1000  (Engagement Data)

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
        cancelledRef.current = true;
        setIsGenerating(false);
        showToast('Report generation cancelled', 'info');
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        cancelledRef.current = false;
        showToast(`Preparing ${currentReportType} report...`, 'info');

        try {
            if (currentReportType === 'farmers') {
                await handleFarmersReport();
            } else if (currentReportType === 'instructors') {
                await handleInstructorsReport();
            } else if (currentReportType === 'engagement') {
                await handleEngagementReport();
            }

            if (!cancelledRef.current) {
                showToast('Report generated successfully!', 'success');
                setIsFilterModalOpen(false);
            }
        } catch (error) {
            if (!cancelledRef.current) {
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

        // Add to history
        addToReportHistory(filename, 'PDF', data.length);
    };

    const generateCSV = (columns, data, filename) => {
        // Sanitize a cell value to prevent CSV injection (OWASP)
        const safeCsvCell = (val) => {
            const str = String(val ?? '');
            // Prefix with tab if value starts with a formula-triggering character
            const sanitized = /^[=+\-@|]/.test(str) ? `\t${str}` : str;
            // Wrap in quotes and escape any internal double-quotes
            return `"${sanitized.replace(/"/g, '""')}"`;
        };

        const csvContent = [
            columns.map(safeCsvCell).join(','),
            ...data.map(row => row.map(safeCsvCell).join(','))
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
        addToReportHistory(filename, 'CSV', data.length);
    };

    // Add report to generation history
    const addToReportHistory = (filename, format, recordCount) => {
        const newReport = {
            id: Date.now(),
            name: filters.reportName || filename,
            type: currentReportType.charAt(0).toUpperCase() + currentReportType.slice(1),
            format: format,
            records: recordCount,
            generatedAt: new Date().toLocaleString(),
            filters: {
                method: filters.method,
                zone: filters.zone,
                status: filters.status,
                division: filters.division
            }
        };

        const updatedHistory = [newReport, ...reportHistory].slice(0, 50); // Keep last 50 reports
        setReportHistory(updatedHistory);
        localStorage.setItem('agriconnect_report_history', JSON.stringify(updatedHistory));
    };

    // Report Handlers
    const handleFarmersReport = async () => {
        try {
            const response = await adminAPI.getUsers('?role=farmer&limit=1000');
            
            let filteredData = response.data || response || [];

            // Filter by method (zone / instructor / division)
            if (filters.method === 'zone' && filters.zone !== 'All') {
                filteredData = filteredData.filter(f =>
                    (f.farmerDetail?.zone || '') === filters.zone
                );
            } else if (filters.method === 'instructor' && filters.instructor !== 'All') {
                if (filters.instructor === '') {
                    // Unassigned farmers
                    filteredData = filteredData.filter(f =>
                        !f.instructor || f.instructor === 'Not Assigned'
                    );
                } else {
                    filteredData = filteredData.filter(f =>
                        (f.instructor || '') === filters.instructor
                    );
                }
            } else if (filters.method === 'division' && filters.division !== 'All') {
                filteredData = filteredData.filter(f =>
                    (f.farmerDetail?.instructor_division || '') === filters.division
                );
            }

            // Filter by Status (case-insensitive)
            if (filters.status !== 'All') {
                filteredData = filteredData.filter(f =>
                    (f.status || '').toLowerCase() === filters.status.toLowerCase()
                );
            }

            const columns = ['ID', 'Name', 'Email', 'District', 'Zone', 'Division', 'Assigned Instructor', 'Status'];
            const data = filteredData.map(f => [
                f.displayId || f.farmerDetail?.farmer_id || `FARM-${f.id}`,
                f.full_name || 'N/A',
                f.email || 'N/A',
                f.farmerDetail?.district || 'N/A',
                f.farmerDetail?.zone ? formatZoneName(f.farmerDetail.zone) : 'N/A',
                f.farmerDetail?.instructor_division || 'N/A',
                f.instructor || 'Not Assigned',
                f.status || 'N/A'
            ]);
            const filename = filters.reportName ? filters.reportName.replace(/\s+/g, '_').toLowerCase() : 'agriconnect_farmers_report';

            if (filters.format === 'CSV') {
                generateCSV(columns, data, filename);
            } else {
                generatePDF('User Management Report', 'Registered Farmers List', columns, data, filename);
            }
        } catch (error) {
            console.error('Error generating farmers report:', error);
            showToast('Error generating report', 'error');
            setIsGenerating(false);
        }
    };

    const handleInstructorsReport = async () => {
        try {
            const response = await adminAPI.getUsers('?role=instructor&limit=1000');
            
            let filteredData = response.data || response || [];

            // Filter by Status (case-insensitive)
            if (filters.status !== 'All') {
                filteredData = filteredData.filter(i =>
                    (i.status || '').toLowerCase() === filters.status.toLowerCase()
                );
            }

            // Filter by Zone
            if (filters.zone !== 'All') {
                filteredData = filteredData.filter(i =>
                    (i.instructorDetail?.zone || i.zone || '') === filters.zone
                );
            }

            const columns = ['ID', 'Name', 'Email', 'District', 'Zone', 'Farmers Count', 'Status'];
            const data = filteredData.map(i => [
                i.instructorDetail?.instructor_id || `INST-${i.id}`,
                i.full_name || 'N/A',
                i.email || 'N/A',
                i.instructorDetail?.district || 'N/A',
                i.instructorDetail?.zone ? formatZoneName(i.instructorDetail.zone) : 'N/A',
                i.farmersCount ?? '0',
                i.status || 'N/A'
            ]);
            const filename = filters.reportName ? filters.reportName.replace(/\s+/g, '_').toLowerCase() : 'agriconnect_instructors_report';

            if (filters.format === 'CSV') {
                generateCSV(columns, data, filename);
            } else {
                generatePDF('User Management Report', 'Registered Instructors List', columns, data, filename);
            }
        } catch (error) {
            console.error('Error generating instructors report:', error);
            showToast('Error generating report', 'error');
            setIsGenerating(false);
        }
    };

    const handleEngagementReport = async () => {
        try {
            const response = await adminAPI.getInstructorEngagement();
            
            let filteredData = response.data || response || [];

            // Filter by Zone
            if (filters.zone !== 'All') {
                filteredData = filteredData.filter(e => e.zone === filters.zone);
            }

            const columns = ['Instructor ID', 'Name', 'Zone', 'Assigned Farmers', 'Avg Rating'];
            const data = filteredData.map(e => [
                e.displayId || e.instructorId || `INSTR-${e.id}`,
                e.full_name || e.name || 'N/A',
                e.zone || 'N/A',
                e.farmersCount || e.farmers_count || '0',
                (e.averageRating || e.average_rating) ? parseFloat(e.averageRating || e.average_rating).toFixed(1) : 'N/A'
            ]);
            const filename = filters.reportName ? filters.reportName.replace(/\s+/g, '_').toLowerCase() : 'agriconnect_engagement_report';

            if (filters.format === 'CSV') {
                generateCSV(columns, data, filename);
            } else {
                generatePDF('Engagement Report', 'Instructor-Farmer Engagement Analysis', columns, data, filename);
            }
        } catch (error) {
            console.error('Error generating engagement report:', error);
            showToast('Error generating report', 'error');
            setIsGenerating(false);
        }
    };

    return (
        <div className={`${styles.page} ${styles.active}`} id="reports">
            <div className={styles.pageTitle}>
                <i className="fas fa-file-lines"></i>
                <h2>{t('reports.title')}</h2>
            </div>

            <div className={styles.cardsGrid}>
                {/* User Management: Farmers */}
                <div className={commonCardStyles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('reports.cardFarmersTitle')}</div>
                        <div className={styles.cardIcon}><i className="fas fa-users"></i></div>
                    </div>
                    <div className={styles.cardContent}>
                        <p className={styles.cardDescriptionText}>
                            {t('reports.cardFarmersDesc')}
                        </p>

                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnFullWidth}`} onClick={() => openFilterModal('farmers')}>
                            <i className="fas fa-download"></i> {t('reports.downloadFarmers')}
                        </button>
                    </div>
                </div>

                {/* User Management: Instructors */}
                <div className={commonCardStyles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('reports.cardInstructorsTitle')}</div>
                        <div className={styles.cardIcon}><i className="fas fa-chalkboard-teacher"></i></div>
                    </div>
                    <div className={styles.cardContent}>
                        <p className={styles.cardDescriptionText}>
                            {t('reports.cardInstructorsDesc')}
                        </p>

                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnFullWidth}`} onClick={() => openFilterModal('instructors')}>
                            <i className="fas fa-download"></i> {t('reports.downloadInstructors')}
                        </button>
                    </div>
                </div>

                {/* Engagement Report */}
                <div className={commonCardStyles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('reports.cardEngagementTitle')}</div>
                        <div className={styles.cardIcon}><i className="fas fa-handshake"></i></div>
                    </div>
                    <div className={styles.cardContent}>
                        <p className={styles.cardDescriptionText}>
                            {t('reports.cardEngagementDesc')}
                        </p>

                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnFullWidth}`} onClick={() => openFilterModal('engagement')}>
                            <i className="fas fa-download"></i> {t('reports.downloadEngagement')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className={`${commonCardStyles.card} ${styles.marginTopLg}`}>
                <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t('reports.historyTitle')}</div>
                    <div className={styles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                </div>
                <div className={styles.cardContent}>
                    {reportHistory.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>
                                <i className="fas fa-inbox"></i>
                            </div>
                            <h3 className={styles.emptyStateTitle}>{t('reports.noReportsYet')}</h3>
                            <p className={styles.emptyStateText}>{t('reports.noReportsDesc')}</p>
                        </div>
                    ) : (
                        <div className={styles.historyTable}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('reports.colReportName')}</th>
                                        <th>{t('reports.colType')}</th>
                                        <th>{t('reports.colFormat')}</th>
                                        <th>{t('reports.colRecords')}</th>
                                        <th>{t('reports.colGeneratedAt')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportHistory.map(report => (
                                        <tr key={report.id}>
                                            <td>{report.name}</td>
                                            <td><span className={styles.typeBadge}>{report.type}</span></td>
                                            <td><span className={styles.formatBadge}>{report.format}</span></td>
                                            <td>{report.records}</td>
                                            <td>{report.generatedAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <ModalPortal>
                    <div className={`${styles.adminModal} ${styles.active} ${styles.modalFlexCenter}`} id="reportFilterModal">
                        <div className={`${styles.adminModalContent} ${styles.modalWidthMedium}`}>
                            <div className={styles.adminModalHeader}>
                                <div className={styles.adminModalTitle}>{t('reports.reportModalTitle')}</div>
                                <button className={styles.adminModalCloseRound} onClick={closeFilterModal}>
                                    <i className="fas fa-xmark"></i>
                                </button>
                            </div>
                            <div className={styles.adminModalBody}>
                                <p className={styles.filterDescription}>
                                    {t('reports.filterDesc')} <strong>{currentReportType === 'farmers' ? t('reports.filterFarmers') : currentReportType === 'instructors' ? t('reports.filterInstructors') : t('reports.filterEngagement')}</strong> {t('reports.filterDescSuffix')}
                                </p>

                                <div className={styles.formGroup}>
                                    <label>{t('reports.reportName')}</label>
                                    <input
                                        type="text"
                                        className={styles.formControl}
                                        name="reportName"
                                        value={filters.reportName}
                                        onChange={handleFilterChange}
                                        placeholder={t('reports.reportNamePlaceholder')}
                                    />
                                </div>

                                {currentReportType === 'farmers' && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label>{t('reports.selectMethod')}</label>
                                            <select
                                                className={`${styles.formControl} ${styles.selectMarginBottom}`}
                                                name="method"
                                                value={filters.method}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="zone">{t('reports.groupByZone')}</option>
                                                <option value="instructor">{t('reports.groupByInstructor')}</option>
                                                <option value="division">{t('reports.groupByDivision')}</option>
                                            </select>
                                        </div>

                                                        {filters.method === 'zone' && (
                                            <div className={styles.formGroup}>
                                                <label>{t('reports.groupByZone')}</label>
                                                <select
                                                    className={styles.formControl}
                                                    name="zone"
                                                    value={filters.zone}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">{t('reports.allZones')}</option>
                                                    {zonesList.map(z => (
                                                        <option key={z} value={z}>{formatZoneName(z)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {filters.method === 'instructor' && (
                                            <div className={styles.formGroup}>
                                            <label>{t('reports.groupByInstructor')}</label>
                                                <select
                                                    className={styles.formControl}
                                                    name="instructor"
                                                    value={filters.instructor}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">{t('reports.allInstructors')}</option>
                                                    <option value="">{t('reports.noAssignedInstructor')}</option>
                                                    {instructorsList.map(inst => (
                                                        <option key={inst.id} value={inst.full_name}>
                                                            {inst.full_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {filters.method === 'division' && (
                                            <div className={styles.formGroup}>
                                                <label>{t('reports.groupByDivision')}</label>
                                                <select
                                                    className={styles.formControl}
                                                    name="division"
                                                    value={filters.division}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="All">{t('reports.allDivisions')}</option>
                                                    {divisionsList.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {(currentReportType === 'instructors' || currentReportType === 'engagement') && (
                                    <div className={styles.formGroup}>
                                        <label>{t('reports.groupByZone')}</label>
                                        <select
                                            className={styles.formControl}
                                            name="zone"
                                            value={filters.zone}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">{t('reports.allZones')}</option>
                                            {zonesList.map(z => (
                                                <option key={z} value={z}>{formatZoneName(z)}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentReportType !== 'engagement' && (
                                    <div className={styles.formGroup}>
                                        <label>{t('reports.filterStatus')}</label>
                                        <select
                                            className={styles.formControl}
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">{t('reports.allStatuses')}</option>
                                            <option value="Active">{t('reports.statusActive')}</option>
                                            <option value="Blocked">{t('reports.statusBlocked')}</option>
                                            <option value="Deleted">{t('reports.statusDeleted')}</option>
                                        </select>
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label>{t('reports.exportFormat')}</label>
                                    <div className={styles.exportFormatGroup}>
                                        <label className={styles.formatRadioLabel}>
                                            <input
                                                type="radio"
                                                name="format"
                                                value="PDF"
                                                checked={filters.format === 'PDF'}
                                                onChange={handleFilterChange}
                                            />
                                            <i className={`fas fa-file-pdf ${styles.iconPdf}`}></i> {t('reports.pdfDocument')}
                                        </label>
                                        <label className={styles.formatRadioLabel}>
                                            <input
                                                type="radio"
                                                name="format"
                                                value="CSV"
                                                checked={filters.format === 'CSV'}
                                                onChange={handleFilterChange}
                                            />
                                            <i className={`fas fa-file-excel ${styles.iconExcel}`}></i> {t('reports.csvSpreadsheet')}
                                        </label>
                                    </div>
                                </div>

                                <div className={styles.adminModalFooter}>
                                    <button
                                        className={`${commonBtnStyles.btn} ${isGenerating ? commonBtnStyles.btnDanger : commonBtnStyles.btnSecondary}`}
                                        onClick={closeFilterModal}
                                    >
                                        {isGenerating ? t('reports.stopGeneration') : t('reports.cancelBtn')}
                                    </button>
                                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSend}`} onClick={handleGenerateReport} disabled={isGenerating}>
                                        {isGenerating ? (
                                            <><i className="fas fa-spinner fa-spin"></i> {t('reports.generatingLabel')}</>
                                        ) : (
                                            <><i className={filters.format === 'PDF' ? "fas fa-file-pdf" : "fas fa-file-excel"}></i> {t('reports.generateDownload')}</>
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
