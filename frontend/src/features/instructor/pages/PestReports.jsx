import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InstructorStatusBadge from '../components/InstructorStatusBadge';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';
import styles from '../styles/PestReports.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import { getAccessToken } from '@/utils/authStorage';

const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const PestReports = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('instructor');
    const [selectedReport, setSelectedReport] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const fileInputRef = useRef(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch reports from backend
    const fetchReports = async () => {
        try {
            const token = getAccessToken();
            const res = await fetch('/api/instructor/pest-reports', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setReports(data.data);
            } else {
                showToast(data.error?.message || 'Failed to load reports', 'error');
            }
        } catch (error) {
            console.error('Error fetching pest reports:', error);
            showToast(t('pest.loadError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Filter reports based on status
    const activeReports = reports.filter(r => r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'in_progress');
    const resolvedReports = reports
        .filter(r => r.status.toLowerCase() === 'resolved')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
            showToast(t('pest.invalidFileType'), 'error');
            e.target.value = '';
            return;
        }
        if (file.size > MAX_ATTACHMENT_SIZE) {
            showToast(t('pest.fileSizeError'), 'error');
            e.target.value = '';
            return;
        }
        setAttachmentFile(file);
    };

    const handleUpdateStatus = async (newStatus, message = '') => {
        try {
            const token = getAccessToken();
            const formData = new FormData();
            formData.append('status', newStatus);
            if (message) formData.append('resolution', message);

            if (attachmentFile) {
                formData.append('attachment', attachmentFile);
            }

            const res = await fetch(`/api/instructor/pest-reports/${selectedReport.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                showToast(t('pest.reportUpdated', { status: newStatus }), 'success');
                setResponseMessage('');
                setAttachmentFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setSelectedReport(null);
                fetchReports(); // Refresh list
            } else {
                showToast(data.error?.message || 'Failed to update report', 'error');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            showToast(t('pest.updateError'), 'error');
        }
    };

    const renderReportDetails = (report) => (
        <div className={styles.instructorDetailView}>
            <div className={styles.instructorDetailsGrid}>
                <div className={styles.instructorDetailGroup}>
                    <p><strong>{t('pest.farmerLabel')}</strong> {report.farmerName}</p>
                    <p><strong>{t('pest.idLabel')}</strong> {report.farmerId}</p>
                    <p><strong>{t('pest.locationLabel')}</strong> {report.location}</p>
                    <p><strong>{t('pest.reportedDateLabel')}</strong> {report.reportedDate}</p>
                </div>
                <div className={styles.instructorDetailGroup}>
                    <p><strong>{t('pest.issueType')}</strong> <span className={styles.textCapitalize}>{report.pestType}</span></p>
                    <p><strong>{t('pest.affectedCropLabel')}</strong> <span className={styles.textCapitalize}>{report.pestCrop}</span></p>
                    <p><strong>{t('pest.severityLabel')}</strong> <InstructorStatusBadge status={report.pestSeverity} type={report.pestSeverity === 'High' ? 'danger' : report.pestSeverity === 'Medium' ? 'warning' : 'success'} /></p>
                </div>
            </div>

            <div className={styles.mb20}>
                <strong>{t('pest.farmerDescription')}</strong>
                <div className={styles.instructorDescriptionBox}>
                    {report.pestNotes}
                </div>
                {report.farmerFiles && report.farmerFiles.length > 0 && (
                    <div className={styles.mt15}>
                        <strong>{t('pest.farmerAttachments')}</strong>
                        <div className={styles.instructorAttachmentList}>
                            {report.farmerFiles.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={getDownloadUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.attachmentLink}
                                    download
                                >
                                    <i className={`fas ${file.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                    <span>{report.farmerFileNames?.[idx] || getFriendlyFileName(file)}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {report.status.toLowerCase() === 'pending' || report.status.toLowerCase() === 'in_progress' ? (
                <div className={styles.instructorActionSection}>
                    <label>{t('pest.yourAdvice')}</label>
                    <textarea
                        className="form-control"
                        rows="5"
                        placeholder={t('pest.advicePlaceholder')}
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                    ></textarea>

                    <div className={`${styles.mt20}`}>
                        <label>{t('pest.attachDocs')}</label>
                        <div className={`${styles.mt8}`}>
                            <input type="file" ref={fileInputRef} className="form-control" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
                            <small className={styles.fileHint}>
                                Upload images or documents (PDF, Word) to help the farmer (optional)
                            </small>
                        </div>
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`}
                            onClick={() => {
                                if (!responseMessage.trim()) {
                                    showToast(t('pest.responseRequired'), 'error');
                                    return;
                                }
                                handleUpdateStatus('resolved', responseMessage);
                            }}
                        >
                            <i className="fas fa-paper-plane"></i> {t('pest.sendAdvice')}
                        </button>
                        {report.status.toLowerCase() === 'in_progress' && (
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnInfo} ${styles.btnInfoCustom}`}
                                onClick={() => handleUpdateStatus('in_progress', responseMessage)}
                            >
                                <i className="fas fa-save"></i> {t('pest.saveProgress')}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.instructorActionSection}>
                    <strong>{t('pest.yourResolution')}</strong>
                    <div className={styles.instructorHistoryBox}>
                        {report.resolution || t('pest.noResolutionNotes')}
                    </div>
                    {report.attachments && report.attachments.length > 0 && (
                        <div className={styles.mt15}>
                            <strong>{t('pest.sharedDocs')}</strong>
                            <div className={styles.instructorAttachmentList}>
                                {report.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={getDownloadUrl(file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.reviewedAttachmentLink}
                                        download
                                    >
                                        <i className={`fas ${file.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                        <span>{report.attachmentNames?.[idx] || getFriendlyFileName(file)}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (loading) {
        return <div className={styles.loadingContainer}>{t('pest.loadingReports')}</div>;
    }

    return (
        <>
            <div className={styles.cardsGrid}>
                {/* New Reports List */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('pest.newFarmerReports')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-envelope-open-text"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.instructorListContainer}>
                            {activeReports.map((report) => (
                                <div className={styles.instructorListItem} key={report.id} onClick={() => setSelectedReport(report)}>
                                    <div className={styles.instructorListInfo}>
                                        <h4>{report.pestName}</h4>
                                        <div className={styles.instructorListDetails}>
                                            <p><strong>{t('pest.farmerLabel')}</strong> {report.farmerName} ({report.farmerId})</p>
                                            <p><strong>{t('pest.locationLabel')}</strong> {report.location}</p>
                                            <p><strong>{t('pest.cropLabel')}</strong> {report.pestCrop} • <strong>{t('pest.reportedLabel')}</strong> {report.reportedDate}</p>
                                        </div>
                                    </div>
                                    <div className={styles.instructorListSide}>
                                        <InstructorStatusBadge status={report.pestSeverity || 'Unknown'} type={report.pestSeverity === 'High' ? 'danger' : report.pestSeverity === 'Medium' ? 'warning' : 'success'} />
                                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnSm}`}>{t('pest.reviewAndRespond')}</button>
                                    </div>
                                </div>
                            ))}
                            {activeReports.length === 0 && (
                                <p className="text-center text-muted p-4">{t('pest.noNewReports')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resolved History */}
                <div className={`${commonCardStyles.card} ${commonCardStyles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('pest.resolvedHistory')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-check-double"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={styles.instructorListContainer}>
                            {resolvedReports.map((report) => (
                                <div className={styles.instructorListItem} key={report.id} onClick={() => setSelectedReport(report)}>
                                    <div className={styles.instructorListInfo}>
                                        <h4>{report.pestName}</h4>
                                        <div className={styles.instructorListDetails}>
                                            <p><strong>{t('pest.farmerLabel')}</strong> {report.farmerName} ({report.farmerId}) • {report.location}</p>
                                            <p><strong>{t('pest.cropLabel')}</strong> {report.pestCrop} • <strong>{t('pest.reportedLabel')}</strong> {report.reportedDate}</p>
                                        </div>
                                    </div>
                                    <div className={styles.instructorListSide}>
                                        <InstructorStatusBadge status="Resolved" type="success" />
                                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary} ${commonBtnStyles.btnSm}`}>{t('pest.viewHistoryBtn')}</button>
                                    </div>
                                </div>
                            ))}
                            {resolvedReports.length === 0 && (
                                <p className="text-center text-muted p-4">{t('pest.noResolvedReports')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Details Overlay Modal */}
            {selectedReport && (
                <div className={styles.viewModalOverlay} onClick={() => setSelectedReport(null)}>
                    <div className={styles.viewModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.viewModalHeader}>
                            <h3 className={styles.viewModalTitle}>
                                <i className="fas fa-bug"></i> {selectedReport.pestName} – Report Details
                            </h3>
                            <button className={styles.viewModalCloseBtn} onClick={() => setSelectedReport(null)}>
                                <i className="fas fa-xmark"></i>
                            </button>
                        </div>
                        <div className={styles.viewModalBody}>
                            {renderReportDetails(selectedReport)}
                        </div>
                        <div className={styles.viewModalFooter}>
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                                onClick={() => setSelectedReport(null)}
                            >
                                {t('cropPlans.closeBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PestReports;
