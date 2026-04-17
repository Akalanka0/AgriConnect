/**
 * Enhanced API service with response interceptors and advanced error handling
 */
import { getAccessToken, clearAccessToken } from '@/utils/authStorage';
import { clearStoredUser } from '@/utils/userStorage';

class EnhancedApiService {
    constructor() {
        this.baseURL = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.setupDefaultInterceptors();
    }

    /**
     * Setup default interceptors for common functionality
     */
    setupDefaultInterceptors() {
        // Request interceptor for auth token
        this.addRequestInterceptor((config) => {
            const token = getAccessToken();
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            return config;
        });

        // Response interceptor for error handling
        this.addResponseInterceptor(
            (response) => response,
            async (error) => {
                if (error.status === 401) {
                    // Handle token expiration
                    clearAccessToken();
                    clearStoredUser();
                    window.location.replace('/login');
                    throw new Error('Session expired. Please login again.');
                }
                throw error;
            }
        );
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(onFulfilled, onRejected) {
        this.responseInterceptors.push({ onFulfilled, onRejected });
    }

    /**
     * Process request through interceptors
     */
    async processRequest(config) {
        let processedConfig = config;
        for (const interceptor of this.requestInterceptors) {
            processedConfig = await interceptor(processedConfig);
        }
        return processedConfig;
    }

    /**
     * Process response through interceptors
     */
    async processResponse(response) {
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
            try {
                if (interceptor.onFulfilled) {
                    processedResponse = await interceptor.onFulfilled(processedResponse);
                }
            } catch (interceptorError) {
                if (interceptor.onRejected) {
                    processedResponse = await interceptor.onRejected(interceptorError);
                } else {
                    throw interceptorError;
                }
            }
        }
        return processedResponse;
    }

    /**
     * Build request configuration
     */
    buildConfig(options = {}) {
        return {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };
    }

    /**
     * Handle API response with enhanced error processing
     */
    async handleResponse(response) {
        let processedResponse;
        
        try {
            const data = await response.json();
            processedResponse = {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: data,
                headers: response.headers,
                url: response.url
            };
        } catch (error) {
            processedResponse = {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: null,
                error: 'Invalid JSON response',
                headers: response.headers,
                url: response.url
            };
        }

        // Process through response interceptors
        processedResponse = await this.processResponse(processedResponse);

        if (!processedResponse.ok) {
            const errorMessage = processedResponse.data?.error?.message || 
                              processedResponse.data?.message || 
                              processedResponse.error ||
                              'Request failed';
            throw new Error(errorMessage);
        }

        return processedResponse.data;
    }

    /**
     * Enhanced HTTP methods with interceptor support
     */
    async request(url, config = {}) {
        const requestConfig = await this.processRequest({
            url: `${this.baseURL}${url}`,
            ...this.buildConfig(config)
        });

        try {
            const response = await fetch(requestConfig.url, requestConfig);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async get(url, config = {}) {
        return this.request(url, { cache: 'no-store', ...config, method: 'GET' });
    }

    async post(url, data, config = {}) {
        return this.request(url, {
            ...config,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(url, data, config = {}) {
        return this.request(url, {
            ...config,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(url, data, config = {}) {
        return this.request(url, {
            ...config,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(url, config = {}) {
        return this.request(url, { ...config, method: 'DELETE' });
    }

    async upload(url, formData, config = {}) {
        const method = typeof config === 'string' ? config : (config.method || 'POST');
        const options = typeof config === 'string' ? {} : config;

        const builtConfig = this.buildConfig({
            ...options,
            method,
            body: formData,
        });
        // Remove Content-Type so the browser auto-sets multipart/form-data with the correct boundary
        delete builtConfig.headers['Content-Type'];

        const requestConfig = await this.processRequest({
            url: `${this.baseURL}${url}`,
            ...builtConfig
        });

        try {
            const response = await fetch(requestConfig.url, requestConfig);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Upload Error:', error);
            throw error;
        }
    }

    /**
     * Utility methods for common patterns
     */
    async retryRequest(url, config = {}, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.request(url, config);
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Request with timeout
     */
    async requestWithTimeout(url, config = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const result = await this.request(url, {
                ...config,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
}

export default new EnhancedApiService();
