import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FarmerStatusBadge from '../components/modals/FarmerStatusBadge';
import { getDownloadUrl, getFriendlyFileName } from '../../../utils/fileUtils';
import styles from '../styles/PestManagement.module.css';
import commonStyles from '../styles/FarmerCommon.module.css';
import commonCardStyles from '@/components/common/styles/Card.module.css';
import commonBtnStyles from '@/components/common/styles/Button.module.css';
import { getAccessToken } from '@/utils/authStorage';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const PestManagement = () => {
    const { showToast } = useOutletContext();
    const { t } = useTranslation('farmer');
    const [pestForm, setPestForm] = useState({
        pestType: '',
        pestName: '',
        pestCrop: '',
        customCropName: '',
        pestSeverity: '',
        pestNotes: '',
        instructorDivision: '',
        assignedInstructor: '',
        assignedInstructorId: '',
        assignedInstructorDisplayId: ''
    });

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch farmer profile, reports, and available crops
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getAccessToken();
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Profile, Reports, and Crops in parallel
                const [profileRes, reportsRes, cropsRes] = await Promise.all([
                    fetch('/api/farmer/profile', { headers }),
                    fetch('/api/farmer/pest-reports', { headers }),
                    fetch('/api/farmer/crop-calendars', { headers })
                ]);

                const [profileData, reportsData, cropsData] = await Promise.all([
                    profileRes.json(),
                    reportsRes.json(),
                    cropsRes.json()
                ]);

                if (profileData.success) {
                    setLocations(profileData.data.locations || []);
                }

                if (reportsData.success) {
                    setReports(reportsData.data);
                }

                if (cropsData.success) {
                    // Extract names and add 'Custom'
                    const dbCropNames = cropsData.data.map(c => c.name);
                    setAvailableCrops([...dbCropNames, 'Custom']);
                } else {
                    // Fallback if API fails
                    setAvailableCrops(['Paddy', 'Chilli', 'Finger Millet', 'Maize', 'Soya Beans', 'Custom']);
                }
            } catch (error) {
                console.error('Error fetching pest management data:', error);
                showToast(t('common.loadError'), 'error');
                // Fallback on error
                setAvailableCrops(['Paddy', 'Chilli', 'Finger Millet', 'Maize', 'Soya Beans', 'Custom']);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    const handleInstructorDivisionChange = (e) => {
        const selectedValue = e.target.value;
        const selectedLoc = locations.find(loc => `${loc.zone} - ${loc.instructorDivision}` === selectedValue);

        setPestForm(prev => ({
            ...prev,
            instructorDivision: selectedValue,
            assignedInstructor: selectedLoc ? selectedLoc.assignedInstructorName : '',
            assignedInstructorId: selectedLoc ? (selectedLoc.assignedInstructorDbId || selectedLoc.assignedInstructorId) : '',
            assignedInstructorDisplayId: selectedLoc ? (selectedLoc.assignedInstructorRefId || '') : ''
        }));
    };

    const handlePestSubmit = async () => {
        // Validation
        const isCustom = pestForm.pestCrop === 'Custom';
        const finalCropName = isCustom ? pestForm.customCropName : pestForm.pestCrop;

        if (!pestForm.pestType || !pestForm.pestName || !finalCropName || !pestForm.pestSeverity || !pestForm.instructorDivision) {
            showToast(t('common.fillRequired'), 'error');
            return;
        }

        try {
            const token = getAccessToken();
            const formData = new FormData();
            formData.append('issue_type', pestForm.pestType);
            formData.append('name', pestForm.pestName);

            // Use custom crop name if 'Custom' is selected
            const finalCropName = pestForm.pestCrop === 'Custom' ? pestForm.customCropName : pestForm.pestCrop;
            formData.append('crop', finalCropName);

            formData.append('severity', pestForm.pestSeverity);
            formData.append('description', pestForm.pestNotes);
            formData.append('instructor_division', pestForm.instructorDivision);
            formData.append('instructor_id', pestForm.assignedInstructorId);

            if (fileInputRef.current && fileInputRef.current.files[0]) {
                formData.append('attachment', fileInputRef.current.files[0]);
            }

            const res = await fetch('/api/farmer/pest-reports', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(t('pest.reportSubmitted'));
                setPestForm({
                    pestType: '',
                    pestName: '',
                    pestCrop: '',
                    customCropName: '',
                    pestSeverity: '',
                    pestNotes: '',
                    instructorDivision: '',
                    assignedInstructor: '',
                    assignedInstructorId: '',
                    assignedInstructorDisplayId: ''
                });
                // Refresh reports
                const reportsRes = await fetch('/api/farmer/pest-reports', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const reportsData = await reportsRes.json();
                if (reportsRes.ok && reportsData.success) {
                    setReports(reportsData.data);
                }
            } else {
                showToast(data.error?.message || 'Failed to submit report', 'error');
            }
        } catch (error) {
            console.error('Error submitting pest report:', error);
            showToast(t('pest.submitError'), 'error');
        }
    };

    // Filter reports
    const pendingReports = reports.filter(r => r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'in_progress');
    const resolvedReports = reports.filter(r => r.status.toLowerCase() === 'resolved');

    return (
        <div className={`page active ${styles.pageDisplay}`} id="pest">
            <div className={commonStyles.pageTitle}>
                <i className="fas fa-bug"></i>
                <h2>{t('pest.title')}</h2>
            </div>

            <div className={commonStyles.cardsGrid}>
                <div className={commonCardStyles.card}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('pest.report')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-bug"></i></div>
                    </div>
                    <div className={commonCardStyles.cardContent}>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.issueType')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={pestForm.pestType}
                                onChange={(e) => setPestForm({ ...pestForm, pestType: e.target.value })}
                            >
                                <option value="">{t('pest.selectType')}</option>
                                <option value="pest">{t('pest.pest')}</option>
                                <option value="disease">{t('pest.disease')}</option>
                                <option value="other">{t('pest.other')}</option>
                            </select>
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.issueName')}</label>
                            <input
                                type="text"
                                className={commonStyles.formControl}
                                placeholder={t('pest.issueNamePlaceholder')}
                                value={pestForm.pestName}
                                onChange={(e) => setPestForm({ ...pestForm, pestName: e.target.value })}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.affectedCrop')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={pestForm.pestCrop}
                                onChange={(e) => setPestForm({ ...pestForm, pestCrop: e.target.value })}
                            >
                                <option value="">{t('pest.selectCropOption')}</option>
                                {availableCrops.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        {pestForm.pestCrop === 'Custom' && (
                            <div className={commonStyles.formGroup}>
                                <label>{t('pest.customCrop')}</label>
                                <input
                                    type="text"
                                    className={commonStyles.formControl}
                                    placeholder={t('pest.customCropPlaceholder')}
                                    value={pestForm.customCropName}
                                    onChange={(e) => setPestForm({ ...pestForm, customCropName: e.target.value })}
                                />
                            </div>
                        )}
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.instructorDiv')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={pestForm.instructorDivision}
                                onChange={handleInstructorDivisionChange}
                            >
                                <option value="">{t('pest.selectField')}</option>
                                {locations.map((loc, idx) => (
                                    <option key={idx} value={`${loc.zone} - ${loc.instructorDivision}`}>
                                        {loc.instructorDivision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.assignedInstructor')}</label>
                            <input
                                type="text"
                                className={`${commonStyles.formControl} ${styles.readonlyInput}`}
                                value={pestForm.assignedInstructor}
                                readOnly
                                placeholder={t('pest.autoAssign')}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.instructorId')}</label>
                            <input
                                type="text"
                                className={`${commonStyles.formControl} ${styles.readonlyInput}`}
                                value={pestForm.assignedInstructorDisplayId}
                                readOnly
                                placeholder={t('pest.autoAssignId')}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.severity')}</label>
                            <select
                                className={commonStyles.formControl}
                                value={pestForm.pestSeverity}
                                onChange={(e) => setPestForm({ ...pestForm, pestSeverity: e.target.value })}
                            >
                                <option value="">{t('pest.selectSeverity')}</option>
                                <option value="low">{t('pest.lowSeverity')}</option>
                                <option value="medium">{t('pest.medSeverity')}</option>
                                <option value="high">{t('pest.highSeverity')}</option>
                            </select>
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.description')}</label>
                            <textarea
                                className={commonStyles.formControl}
                                placeholder={t('pest.descriptionPlaceholder')}
                                rows="4"
                                value={pestForm.pestNotes}
                                onChange={(e) => setPestForm({ ...pestForm, pestNotes: e.target.value })}
                            />
                        </div>
                        <div className={commonStyles.formGroup}>
                            <label>{t('pest.attachImage')}</label>
                            <div className={styles.fileUpload}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className={commonStyles.formControl}
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                                            showToast(t('pest.invalidImageType'), 'error');
                                            e.target.value = '';
                                            return;
                                        }
                                        if (file.size > MAX_ATTACHMENT_SIZE) {
                                            showToast(t('pest.imageSizeError'), 'error');
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <small className={styles.fileHint}>{t('pest.uploadImageHint')}</small>
                            </div>
                        </div>
                        <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={handlePestSubmit}>
                            <i className="fas fa-paper-plane"></i> Submit Report
                        </button>
                    </div>
                </div>

                {/* Submitted Reports Card */}
                <div className={`${commonCardStyles.card} ${commonStyles.widerCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('pest.activeReports')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-clipboard-list"></i></div>
                    </div>
                    <div className={`${commonCardStyles.cardContent} ${styles.scrollableContent}`}>
                        <div className={styles.reportsList}>
                            {pendingReports.length > 0 ? pendingReports.map((report, index) => (
                                <div className={`report-item ${styles.reportItem}`} key={report.id || index}>
                                    <div className={`report-info ${styles.reportInfo}`}>
                                        <div className={styles.reportHeader}>
                                            <h4>{report.name}</h4>
                                        </div>
                                        <div className={styles.reportDetails}>
                                            <p><strong>{t('pest.typeLabel')}</strong> {report.issue_type}</p>
                                            <p><strong>{t('pest.affectedCropLabel')}</strong> {report.crop}</p>
                                            <p><strong>{t('pest.severityLabel')}</strong> <FarmerStatusBadge status={report.severity} type={report.severity === 'High' ? 'danger' : report.severity === 'Medium' ? 'warning' : 'success'} /></p>
                                            <p>{report.description}</p>
                                        </div>
                                    </div>
                                    <div className={styles.reportSide}>
                                        <FarmerStatusBadge status={report.status} type={report.status === 'pending' ? 'warning' : 'success'} />
                                        <div className={styles.reportBottom}>
                                            <span className={styles.reportDate}>{new Date(report.created_at).toLocaleDateString()}</span>
                                            <div className={styles.reportActions}>
                                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={() => { setSelectedReport(report); document.body.style.overflow = 'hidden'; }}>{t('pest.viewBtn')}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className={styles.emptyState}>
                                    {t('pest.noActive')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviewed Reports Card */}
                <div className={`${commonCardStyles.card} ${commonStyles.fullWidthCard}`}>
                    <div className={commonCardStyles.cardHeader}>
                        <div className={commonCardStyles.cardTitle}>{t('pest.resolvedReports')}</div>
                        <div className={commonCardStyles.cardIcon}><i className="fas fa-circle-check"></i></div>
                    </div>
                    <div className={`${commonCardStyles.cardContent} ${styles.scrollableContent}`}>
                        <div className={styles.reportsList}>
                            {resolvedReports.length > 0 ? resolvedReports.map((report, index) => (
                                <div className={`report-item ${styles.reportItem}`} key={report.id || index}>
                                    <div className={`report-info ${styles.reportInfo}`}>
                                        <div className={styles.reportHeader}>
                                            <h4>{report.name}</h4>
                                        </div>
                                        <div className={styles.reportDetails}>
                                            <p><strong>{t('pest.typeLabel')}</strong> {report.issue_type}</p>
                                            <p><strong>{t('pest.affectedCropLabel')}</strong> {report.crop}</p>
                                            <p><strong>{t('pest.severityLabel')}</strong> <FarmerStatusBadge status={report.severity} type={report.severity === 'High' ? 'danger' : report.severity === 'Medium' ? 'warning' : 'success'} /></p>
                                        </div>
                                    </div>
                                    <div className={styles.reportSide}>
                                        <FarmerStatusBadge status={report.status} type="success" />
                                        <div className={styles.reportBottom}>
                                            <span className={styles.reportDate}>{new Date(report.created_at).toLocaleDateString()}</span>
                                            <div className={styles.reportActions}>
                                                <button className={`${commonBtnStyles.btn} ${commonBtnStyles.btnPrimary}`} onClick={() => { setSelectedReport(report); document.body.style.overflow = 'hidden'; }}>{t('pest.viewDetails')}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className={styles.emptyState}>
                                    {t('pest.noResolved')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedReport && (
                <div className={styles.viewModalOverlay} onClick={() => { setSelectedReport(null); document.body.style.overflow = 'auto'; }}>
                    <div className={styles.viewModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.viewModalHeader}>
                            <h3 className={styles.viewModalTitle}>
                                <i className={`fas fa-bug ${styles.viewModalTitleIcon}`}></i>
                                {selectedReport.name} Report Details
                            </h3>
                            <button
                                onClick={() => { setSelectedReport(null); document.body.style.overflow = 'auto'; }}
                                className={styles.viewModalCloseBtn}
                            >
                                <i className="fas fa-xmark"></i>
                            </button>
                        </div>
                        <div className={styles.viewModalBody}>
                            <div className={styles.viewModalGrid}>
                                <div>
                                    <h4 className={styles.viewModalSectionTitle}>{t('pest.modalReportInfo')}</h4>
                                    <div className={styles.viewModalInfoList}>
                                        <p className={styles.viewModalInfoItem}><strong>{t('pest.reportedDate')}:</strong> {new Date(selectedReport.created_at).toLocaleDateString()}</p>
                                        <p className={styles.viewModalInfoItem}><strong>{t('pest.modalIssueType')}:</strong> <span className={styles.capitalize}>{selectedReport.issue_type}</span></p>
                                        <p className={styles.viewModalInfoItem}><strong>{t('pest.modalAffectedCrop')}:</strong> <span className={styles.capitalize}>{selectedReport.crop}</span></p>
                                        <p className={styles.viewModalInfoItem}><strong>{t('pest.modalSeverity')}:</strong>&nbsp;
                                            <FarmerStatusBadge status={selectedReport.severity} type={selectedReport.severity?.toLowerCase() === 'high' ? 'danger' : selectedReport.severity?.toLowerCase() === 'medium' ? 'warning' : 'success'} />
                                        </p>
                                        <p className={styles.viewModalInfoItem}><strong>{t('pest.modalStatus')}:</strong>&nbsp;
                                            <FarmerStatusBadge status={selectedReport.status} type={selectedReport.status?.toLowerCase() === 'pending' ? 'warning' : selectedReport.status?.toLowerCase() === 'in_progress' ? 'info' : 'success'} />
                                        </p>
                                        {selectedReport.location && (
                                            <p className={styles.viewModalInfoItem}><strong>{t('pest.modalLocation')}:</strong> {selectedReport.location}</p>
                                        )}
                                        {(selectedReport.instructor_name || selectedReport.instructor_display_id) && (
                                            <p className={styles.viewModalInfoItem}><strong>{t('pest.modalInstructor')}:</strong> {selectedReport.instructor_name}{selectedReport.instructor_display_id ? ` (${selectedReport.instructor_display_id})` : ''}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className={styles.viewModalSectionTitle}>{t('pest.yourDesc')}</h4>
                                    <div className={styles.viewModalNotes}>
                                        {selectedReport.description || t('pest.noDesc')}
                                    </div>
                                </div>
                            </div>

                            {selectedReport.farmerFiles && selectedReport.farmerFiles.length > 0 && (
                                <div className={styles.viewModalAttachmentsSection}>
                                    <h4 className={styles.viewModalSectionTitle}>{t('pest.yourAttachments')}</h4>
                                    <div className={styles.attachmentList}>
                                        {selectedReport.farmerFiles.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={getDownloadUrl(file)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.attachmentItemFarmer}
                                                download
                                            >
                                                <i className={`fas ${file.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                                <span>{selectedReport.farmerFileNames?.[idx] || getFriendlyFileName(file)}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedReport.status?.toLowerCase() === 'resolved' || (selectedReport.status?.toLowerCase() === 'in_progress' && selectedReport.resolution)) && (
                                <div className={styles.viewModalFeedbackContainer}>
                                    <h4 className={styles.feedbackSectionTitle}>
                                        {selectedReport.status?.toLowerCase() === 'resolved' ? t('pest.instructorFinalResolution') : t('pest.instructorAdvice')}
                                    </h4>
                                    <div className={`${styles.feedbackContent} ${selectedReport.status?.toLowerCase() === 'resolved' ? styles.feedbackResolved : styles.feedbackInProgress}`}>
                                        <p className={styles.feedbackText}>"{selectedReport.resolution || t('pest.noNotes')}"</p>
                                    </div>
                                    {selectedReport.instructorFiles && selectedReport.instructorFiles.length > 0 && (
                                        <div className={styles.viewModalAttachmentsSection}>
                                            <h4 className={styles.viewModalSectionTitle}>{t('pest.sharedDocs')}</h4>
                                            <div className={styles.attachmentList}>
                                                {selectedReport.instructorFiles.map((file, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={getDownloadUrl(file)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.instructorAttachmentItem}
                                                        download
                                                    >
                                                        <i className={`fas ${file.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : (file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'fa-file-image' : 'fa-file')}`}></i>
                                                        <span>{selectedReport.instructorFileNames?.[idx] || getFriendlyFileName(file)}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.viewModalFooter}>
                            <button
                                className={`${commonBtnStyles.btn} ${commonBtnStyles.btnSecondary}`}
                                onClick={() => { setSelectedReport(null); document.body.style.overflow = 'auto'; }}
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PestManagement;
