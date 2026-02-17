import apiService from './enhancedApiService.js';

/**
 * Farmer API service
 */
export const farmerAPI = {
    /**
     * Dashboard
     */
    getDashboardStats: () => apiService.get('/farmer/dashboard/stats'),
    getRecentHistory: () => apiService.get('/farmer/dashboard/history'),
    getInstructors: () => apiService.get('/farmer/instructors'),

    /**
     * Ratings
     */
    submitInstructorRating: (ratingData) => apiService.post('/farmer/instructor-rating', ratingData),
    deleteInstructorRating: (ratingId) => apiService.delete('/farmer/instructor-rating', { ratingId }),
    getMyRatings: () => apiService.get('/farmer/my-ratings'),

    /**
     * Pest Management
     */
    reportPest: (formData) => apiService.upload('/farmer/pest-reports', formData),
    getMyPestReports: () => apiService.get('/farmer/pest-reports'),

    /**
     * Harvest Tracking
     */
    recordHarvest: (harvestData) => apiService.post('/farmer/harvest-records', harvestData),
    getMyHarvestRecords: () => apiService.get('/farmer/harvest-records'),
    deleteHarvestRecord: (id) => apiService.delete(`/farmer/harvest-records/${id}`),

    /**
     * Activity Logging
     */
    logActivity: (activityData) => apiService.post('/farmer/activities', activityData),
    getMyActivities: () => apiService.get('/farmer/activities'),
    deleteActivity: (id) => apiService.delete(`/farmer/activities/${id}`),

    /**
     * Crop Planning
     */
    submitCropPlan: (formData) => apiService.upload('/farmer/crop-plans', formData),
    getMyCropPlans: () => apiService.get('/farmer/crop-plans'),
    getCropCalendars: () => apiService.get('/farmer/crop-calendars'),

    /**
     * Meetings
     */
    requestMeeting: (meetingData) => apiService.post('/farmer/meetings', meetingData),
    getMyMeetings: () => apiService.get('/farmer/meetings'),
    cancelMeeting: (id) => apiService.patch(`/farmer/meetings/${id}/cancel`),
    acceptReschedule: (id) => apiService.patch(`/farmer/meetings/${id}/accept-reschedule`),

    /**
     * Profile & Settings
     */
    getProfile: () => apiService.get('/farmer/profile'),
    updateProfile: (profileData) => apiService.put('/farmer/profile', profileData),
    updateProfilePicture: (formData) => apiService.upload('/farmer/profile/picture', formData),
    removeProfilePicture: () => apiService.delete('/farmer/profile/picture'),
    getRegionHierarchy: () => apiService.get('/farmer/region-hierarchy'),

    /**
     * Messages
     */
    getMyMessages: () => apiService.get('/farmer/messages'),
    sendMessage: (formData) => apiService.upload('/farmer/messages', formData),
    markMessageAsRead: (id) => apiService.patch(`/farmer/messages/${id}/read`),
};
