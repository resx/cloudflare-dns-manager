/**
 * Unified API Client
 * Handles authentication, token management, and automatic logout on 401 errors
 */

let logoutCallback = null;

// Register logout callback from authContext
export const registerLogoutCallback = (callback) => {
    logoutCallback = callback;
};

// Check if token is expired based on stored expiration time
const isTokenExpired = () => {
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt);
};

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Handle 401 errors by logging out and redirecting
const handle401Error = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');

    // Call logout callback if registered
    if (logoutCallback) {
        logoutCallback();
    }

    // Redirect to login
    window.location.href = '/login';
};

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise} Response data
 */
export const apiRequest = async (url, options = {}) => {
    // Check if token is expired before making request
    if (isTokenExpired()) {
        handle401Error();
        throw new Error('Session expired. Please login again.');
    }

    // Get token
    const token = getAuthToken();

    // Prepare headers
    const headers = {
        ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Make request
    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            handle401Error();
            throw new Error('Session expired. Please login again.');
        }

        // Return response for caller to handle
        return response;
    } catch (error) {
        // Re-throw network errors
        throw error;
    }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
    get: (url, options = {}) => {
        return apiRequest(url, { ...options, method: 'GET' });
    },

    post: (url, data, options = {}) => {
        return apiRequest(url, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            body: JSON.stringify(data),
        });
    },

    put: (url, data, options = {}) => {
        return apiRequest(url, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            body: JSON.stringify(data),
        });
    },

    delete: (url, options = {}) => {
        return apiRequest(url, { ...options, method: 'DELETE' });
    },
};

export default apiClient;
