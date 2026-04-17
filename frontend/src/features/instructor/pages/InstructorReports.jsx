import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../styles/InstructorReports.module.css';
import modalStyles from '../styles/InstructorModals.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getAccessToken } from '@/utils/authStorage';
import { instructorAPI } from '@/services/instructorService';

const InstructorReports = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('instructor');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [currentReportType, setCurrentReportType] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [divisions, setDivisions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'All',
        division: 'All'
    });

    const formatReportName = (name) => {
        if (!name) return '';
        return name
            .replace(/\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/u, '')
            .replace(/\s*\(CSV\)\s*/u, '(CSV)')
            .trim();
    };

    // Fetch instructor profile to get actual divisions
    useEffect(() => {
        const fetchInstructorProfile = async () => {
            try {
                const token = getAccessToken();
                const response = await fetch('/api/instructor/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    const assigned = result.data?.instructorDetail?.assigned_divisions ?? result.data?.assigned_divisions;
                    const parsed = Array.isArray(assigned)
                        ? assigned
                        : (typeof assigned === 'string' && assigned.trim()
                            ? JSON.parse(assigned)
                            : []);
                    setDivisions(parsed);
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
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setHistoryLoading(true);
            try {
                const res = await instructorAPI.getReportHistory();
                console.log('Fetch History Response:', res);
                let historyArray = [];
                if (res) {
                    if (Array.isArray(res)) historyArray = res;
                    else if (Array.isArray(res.data)) historyArray = res.data;
                    else if (res.data && Array.isArray(res.data.data)) historyArray = res.data.data;
                    else if (res.data && res.data.data && Array.isArray(res.data.data.data)) historyArray = res.data.data.data;
                    else if (res && typeof res === 'object' && !Array.isArray(res) && Object.keys(res).length > 0 && Array.isArray(res[Object.keys(res)[0]])) historyArray = res[Object.keys(res)[0]]; // Catch any dynamic key
                    else if (res.data && Array.isArray(res.data.history)) historyArray = res.data.history;
                    else if (res.data && res.data.data && Array.isArray(res.data.data.history)) historyArray = res.data.data.history;
                    else if (Array.isArray(res.history)) historyArray = res.history;
                }
                setReportHistory(historyArray);
            } catch (error) {
                console.error("Failed to fetch report history", error);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const openFilterModal = (type) => {
        setCurrentReportType(type);
        setFilters(prev => ({ ...prev, status: 'All' }));
        setIsFilterModalOpen(true);
    };

    const closeFilterModal = () => {
        setIsFilterModalOpen(false);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const generatePDF = async (title, subtitle, columns, data, filename) => {
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

        try {
            const reportName = `${currentReportType} Report`;
            const res = await instructorAPI.addReportHistory({
                category: currentReportType,
                report_name: reportName,
                status: 'Success'
            });
            if (res) {
                let newRecord = res;
                if (res && res.data) newRecord = res.data;
                if (res && res.data && res.data.data) newRecord = res.data.data;
                if (newRecord && Array.isArray(newRecord)) newRecord = newRecord[0]; // safety for add
                setReportHistory(prev => [newRecord, ...prev]);
            }
        } catch (error) {
            console.error("Failed to save report history", error);
            // Fallback for UI if network fails
            const newEntry = {
                id: Date.now(),
                category: currentReportType,
                report_name: `${currentReportType} Report`,
                created_at: new Date().toISOString(),
                status: 'Success'
            };
            setReportHistory(prev => [newEntry, ...prev]);
        }
    };

    const handleGenerateReport = async () => {
        // Enhanced Validation
        if (!filters.startDate || !filters.endDate) {
            showToast(t('reports.datesRequired'), 'error');
            return;
        }

        if (new Date(filters.startDate) > new Date(filters.endDate)) {
            showToast(t('reports.dateOrderError'), 'error');
            return;
        }

        // Add date range limit (max 1 year)
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        const maxDate = new Date(startDate);
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        
        if (endDate > maxDate) {
            showToast(t('reports.dateRangeError'), 'error');
            return;
        }

        setIsGenerating(true);
        showToast(t('reports.generatingReport', { type: currentReportType }), 'info');

        try {
            const token = getAccessToken();
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

                await generatePDF(
                    `${currentReportType} Report`,
                    `Detailed analysis for selected duration and filters`,
                    columns,
                    rows,
                    filename
                );
                showToast(t('reports.reportSuccess'), 'success');
                closeFilterModal();
            } else {
                showToast(result.error?.message || 'Failed to generate report', 'error');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showToast(t('reports.reportError'), 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <div className={styles.dashboardGrid}>
                {/* Pest Management Report Card */}
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('reports.pestReports')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-bug"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <p className={`${commonCardStyles.cardDescriptionText} ${styles.reportDescription}`}>
                            {t('reports.pestCardDesc')}
                        </p>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnFullWidth}`}
                            onClick={() => openFilterModal('Pest Management')}
                        >
                            <i className="fas fa-download"></i> {t('reports.downloadReport')}
                        </button>
                    </div>
                </div>

                {/* Crop Plan Report Card */}
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('reports.cropPlanReports')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-seedling"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <p className={`${commonCardStyles.cardDescriptionText} ${styles.reportDescription}`}>
                            {t('reports.cropPlanCardDesc')}
                        </p>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnFullWidth}`}
                            onClick={() => openFilterModal('Crop Plans')}
                        >
                            <i className="fas fa-download"></i> {t('reports.downloadReport')}
                        </button>
                    </div>
                </div>

                {/* Meetings Report Card */}
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('reports.meetingReports')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-calendar-check"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <p className={`${commonCardStyles.cardDescriptionText} ${styles.reportDescription}`}>
                            {t('reports.meetingCardDesc')}
                        </p>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnFullWidth}`}
                            onClick={() => openFilterModal('Meetings')}
                        >
                            <i className="fas fa-download"></i> {t('reports.downloadReport')}
                        </button>
                    </div>
                </div>
            </div>

            {/* History Table in a Card */}
            <div className={`${commonCardStyles.card} ${commonCardStyles.cardMarginTop}`}>
                <div className={commonCardStyles.cardHeader}>
                    <div className={commonCardStyles.cardTitle}>{t('reports.historyTitle')}</div>
                    <div className={commonCardStyles.cardIcon}><i className="fas fa-clock-rotate-left"></i></div>
                </div>
                <div className={commonCardStyles.cardContent}>
                    <div className={styles.tableContainer}>
                        <table className={styles.historyTable}>
                            <thead>
                                <tr>
                                    <th>{t('reports.colCategory')}</th>
                                    <th>{t('reports.colReportName')}</th>
                                    <th>{t('reports.colGeneratedOn')}</th>
                                    <th>{t('reports.colStatus')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportHistory.map(report => (
                                    <tr key={report.id}>
                                        <td>{report.category}</td>
                                        <td>{formatReportName(report.report_name || report.name)}</td>
                                        <td>{report.created_at ? new Date(report.created_at).toLocaleDateString() : report.date}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} status-completed`}>
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
                <div className={modalStyles.instructorModalFlex}>
                            <div className={modalStyles.instructorModalContent}>
                                <div className={modalStyles.instructorModalHeader}>
                                    <div className={modalStyles.instructorModalTitle}>
                                        {t('reports.generateReport')} - {currentReportType === 'Pest Management' ? t('reports.pestReports') : currentReportType === 'Crop Plans' ? t('reports.cropPlanReports') : t('reports.meetingReports')}
                                    </div>
                                    <span className={modalStyles.instructorClose} onClick={closeFilterModal}><i className="fas fa-xmark"></i></span>
                                </div>
                                <div className={modalStyles.instructorModalBody}>
                                    <p className={commonCardStyles.cardDescriptionText}>
                                        {currentReportType === 'Pest Management' && t('reports.pestModalDesc')}
                                        {currentReportType === 'Crop Plans' && t('reports.cropPlanModalDesc')}
                                        {currentReportType === 'Meetings' && t('reports.meetingModalDesc')}
                                    </p>

                                    <div className={`${styles.formGroup} ${isGenerating ? styles.disabled : ''}`}>
                                        <label>{t('reports.startDate')} <span className={styles.required}>*</span></label>
                                        <input
                                            type="date"
                                            className={styles.formControl}
                                            name="startDate"
                                            value={filters.startDate}
                                            onChange={handleFilterChange}
                                            required
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${isGenerating ? styles.disabled : ''}`}>
                                        <label>{t('reports.endDate')} <span className={styles.required}>*</span></label>
                                        <input
                                            type="date"
                                            className={styles.formControl}
                                            name="endDate"
                                            value={filters.endDate}
                                            onChange={handleFilterChange}
                                            required
                                            disabled={isGenerating}
                                        />
                                    </div>

                                <div className={`${styles.formGroup} ${isGenerating ? styles.disabled : ''}`}>
                                    <label>{t('reports.statusFilter')}</label>
                                    <select
                                        className={styles.formControl}
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        disabled={isGenerating}
                                    >
                                            {currentReportType === 'Pest Management' && (
                                                <>
                                                    <option value="All">{t('reports.allStatuses')}</option>
                                                    <option value="pending">{t('reports.pending')}</option>
                                                    <option value="resolved">{t('reports.resolved')}</option>
                                                </>
                                            )}
                                            {currentReportType === 'Crop Plans' && (
                                                <>
                                                    <option value="All">{t('reports.allStatuses')}</option>
                                                    <option value="pending">{t('reports.pendingReview')}</option>
                                                    <option value="approved">{t('reports.approved')}</option>
                                                    <option value="correction">{t('reports.correctionRequested')}</option>
                                                </>
                                            )}
                                            {currentReportType === 'Meetings' && (
                                                <>
                                                    <option value="All">{t('reports.allStatuses')}</option>
                                                    <option value="pending">{t('reports.pending')}</option>
                                                    <option value="accepted">{t('reports.accepted')}</option>
                                                    <option value="reschedule">{t('reports.rescheduleRequested')}</option>
                                                    <option value="rejected">{t('reports.rejected')}</option>
                                                    <option value="declined">{t('reports.declined')}</option>
                                                    <option value="cancelled">{t('reports.cancelled')}</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>{t('reports.reportDivisionFilter')}</label>
                                        <select
                                            className={styles.formControl}
                                            name="division"
                                            value={filters.division}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="All">{t('reports.allDivisions')}</option>
                                            {divisions.map(div => (
                                                <option key={div} value={div}>{div}</option>
                                            ))}
                                        </select>
                                    </div>

                                </div>
                                <div className={modalStyles.instructorModalFooter}>
                                    <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`} onClick={closeFilterModal}>{t('reports.cancelBtn')}</button>
                                    <button
                                        className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`}
                                        onClick={handleGenerateReport}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? t('reports.generating') : t('reports.generateReport')}
                                    </button>
                                </div>
                            </div>
                </div>
            )}
        </>
    );
};

export default InstructorReports;


