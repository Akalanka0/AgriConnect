import apiService from './enhancedApiService.js';

/**
 * Instructor API service
 */
export const instructorAPI = {
    /**
     * Dashboard
     */
    getDashboardStats: () => apiService.get('/instructor/dashboard/stats'),

    /**
     * Farmer Management
     */
    getFarmers: () => apiService.get('/instructor/farmers'),
    getFarmer: (id) => apiService.get(`/instructor/farmers/${id}`),
    updateFarmerStatus: (id, status) => apiService.patch(`/instructor/farmers/${id}/status`, { status }),

    /**
     * Crop Plan Review
     */
    getCropPlans: () => apiService.get('/instructor/crop-plans'),
    getCropPlan: (id) => apiService.get(`/instructor/crop-plans/${id}`),
    reviewCropPlan: (id, reviewData) => apiService.patch(`/instructor/crop-plans/${id}/review`, reviewData),
    approveCropPlan: (id) => apiService.patch(`/instructor/crop-plans/${id}/approve`),
    rejectCropPlan: (id, reason) => apiService.patch(`/instructor/crop-plans/${id}/reject`, { reason }),

    /**
     * Pest Reports
     */
    getPestReports: () => apiService.get('/instructor/pest-reports'),
    getPestReport: (id) => apiService.get(`/instructor/pest-reports/${id}`),
    updatePestReport: (id, reportData) => apiService.put(`/instructor/pest-reports/${id}`, reportData),
    resolvePestReport: (id) => apiService.patch(`/instructor/pest-reports/${id}/resolve`),

    /**
     * Schedule Management
     */
    getSchedule: () => apiService.get('/instructor/schedule'),
    getMeetings: () => apiService.get('/instructor/meetings'),
    updateMeeting: (id, meetingData) => apiService.put(`/instructor/meetings/${id}`, meetingData),
    cancelMeeting: (id) => apiService.patch(`/instructor/meetings/${id}/cancel`),

    /**
     * Reports
     */
    getReports: (params) => apiService.get('/instructor/reports', params),
    getFarmerReports: (farmerId) => apiService.get(`/instructor/reports/farmers/${farmerId}`),

    /**
     * Profile & Settings
     */
    getProfile: () => apiService.get('/instructor/profile'),
    updateProfile: (profileData) => apiService.put('/instructor/profile', profileData),
    updateProfilePicture: (formData) => apiService.upload('/instructor/profile/picture', formData),
    removeProfilePicture: () => apiService.delete('/instructor/profile/picture'),

    /**
     * Messages
     */
    getMessages: () => apiService.get('/instructor/messages'),
    sendMessage: (formData) => apiService.upload('/instructor/messages', formData),
    markMessageAsRead: (id) => apiService.patch(`/instructor/messages/${id}/read`),

    /**
     * Crop Calendars
     */
    getCropCalendars: () => apiService.get('/instructor/crop-calendars'),
    createCropCalendar: (calendarData) => apiService.post('/instructor/crop-calendars', calendarData),
    updateCropCalendar: (id, calendarData) => apiService.put(`/instructor/crop-calendars/${id}`, calendarData),
    deleteCropCalendar: (id) => apiService.delete(`/instructor/crop-calendars/${id}`),

    /**
     * Region Management
     */
    getRegionHierarchy: () => apiService.get('/instructor/region-hierarchy'),
    getAssignedRegions: () => apiService.get('/instructor/assigned-regions'),
};
