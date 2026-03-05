import apiService from './enhancedApiService.js';

/**
 * Admin API service
 */
export const adminAPI = {
    /**
     * Dashboard
     */
    getDashboardStats: () => apiService.get('/admin/stats'),

    /**
     * User Management
     */
    getUsers: (queryString) => apiService.get(`/admin/users${queryString ? queryString : ''}`),
    getUser: (id) => apiService.get(`/admin/users/${id}`),
    createUser: (userData) => apiService.post('/admin/users', userData),
    updateUser: (id, userData) => apiService.put(`/admin/users/${id}`, userData),
    deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
    toggleUserStatus: (id, status) => apiService.put(`/admin/users/${id}/status`, { status }),
    inviteAdmin: (data) => apiService.post('/admin/invite', data),

    /**
     * User ID Management
     */
    getUserIds: (type) => apiService.get(`/admin/ids?type=${type}`),
    generateUserId: (type) => apiService.post('/admin/ids/generate', { type }),
    updateUserIdStatus: (id, status) => apiService.put(`/admin/ids/${id}/status`, { status }),
    pruneUserIds: (type, status) => apiService.delete('/admin/ids/prune', { body: JSON.stringify({ type, status }) }),

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
     * Reports & Engagement
     */
    getEngagementStats: () => apiService.get('/admin/engagement'),
    getInstructorEngagement: () => apiService.get('/admin/engagement/instructors'),

    /**
     * Settings & Profile
     */
    getSystemSettings: () => apiService.get('/admin/settings'),
    updateSetting: (key, value) => apiService.put(`/admin/settings/${key}`, { value }),
    updateProfile: (formData) => apiService.upload('/admin/profile', formData, 'PUT'),
    removeProfilePicture: () => apiService.delete('/admin/profile/picture'),
    updatePassword: (data) => apiService.put('/admin/password', data),

    /**
     * Region Hierarchy (Zones & Divisions)
     */
    getRegionHierarchy: () => apiService.get('/admin/region-hierarchy'),
    updateRegionHierarchy: (hierarchy) => apiService.put('/admin/region-hierarchy', { hierarchy }),

    /**
     * Messages
     */
    sendMessage: (formData) => apiService.upload('/admin/messages/send', formData),
    getMessages: () => apiService.get('/admin/messages'),
    markMessageAsRead: (id) => apiService.patch(`/admin/messages/${id}/read`),
    deleteMessage: (id) => apiService.delete(`/admin/messages/${id}`)
};
