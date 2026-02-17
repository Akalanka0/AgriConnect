import apiService from './enhancedApiService.js';

/**
 * Admin API service
 */
export const adminAPI = {
    /**
     * Dashboard
     */
    getDashboardStats: () => apiService.get('/admin/dashboard/stats'),

    /**
     * User Management
     */
    getUsers: (params) => apiService.get('/admin/users', params),
    getUser: (id) => apiService.get(`/admin/users/${id}`),
    createUser: (userData) => apiService.post('/admin/users', userData),
    updateUser: (id, userData) => apiService.put(`/admin/users/${id}`, userData),
    deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
    toggleUserStatus: (id) => apiService.patch(`/admin/users/${id}/toggle-status`),

    /**
     * User ID Management
     */
    getUserIds: () => apiService.get('/admin/user-ids'),
    generateUserId: (role) => apiService.post('/admin/user-ids/generate', { role }),
    updateUserId: (id, userIdData) => apiService.put(`/admin/user-ids/${id}`, userIdData),

    /**
     * Pest Management
     */
    getPests: () => apiService.get('/admin/pests'),
    getPest: (id) => apiService.get(`/admin/pests/${id}`),
    createPest: (pestData) => apiService.post('/admin/pests', pestData),
    updatePest: (id, pestData) => apiService.put(`/admin/pests/${id}`, pestData),
    deletePest: (id) => apiService.delete(`/admin/pests/${id}`),

    /**
     * Crop Management
     */
    getCrops: () => apiService.get('/admin/crops'),
    getCrop: (id) => apiService.get(`/admin/crops/${id}`),
    createCrop: (cropData) => apiService.post('/admin/crops', cropData),
    updateCrop: (id, cropData) => apiService.put(`/admin/crops/${id}`, cropData),
    deleteCrop: (id) => apiService.delete(`/admin/crops/${id}`),

    /**
     * Harvest Management
     */
    getHarvests: () => apiService.get('/admin/harvests'),
    getHarvest: (id) => apiService.get(`/admin/harvests/${id}`),
    createHarvest: (harvestData) => apiService.post('/admin/harvests', harvestData),
    updateHarvest: (id, harvestData) => apiService.put(`/admin/harvests/${id}`, harvestData),
    deleteHarvest: (id) => apiService.delete(`/admin/harvests/${id}`),

    /**
     * Reports
     */
    getEngagementReports: (params) => apiService.get('/admin/reports/engagement', params),
    getUserReports: (params) => apiService.get('/admin/reports/users', params),
    getActivityReports: (params) => apiService.get('/admin/reports/activity', params),

    /**
     * Settings
     */
    getSettings: () => apiService.get('/admin/settings'),
    updateSetting: (key, value) => apiService.put('/admin/settings', { key, value }),
    getSystemSettings: () => apiService.get('/admin/system-settings'),
    updateSystemSettings: (settings) => apiService.put('/admin/system-settings', settings),
};
