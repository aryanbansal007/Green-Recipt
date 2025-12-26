import axios from "axios";

// ==========================================
// CONFIGURATION
// ==========================================
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Token storage keys
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";
const ROLE_KEY = "role";
const USER_KEY = "user";
const IS_PROFILE_COMPLETE_KEY = "isProfileComplete";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

// Track if we're currently refreshing to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe to token refresh
const subscribeToTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Notify all subscribers when refresh fails
const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
};

// Get stored access token
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);

// Get stored refresh token
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

// Check if access token is expired or about to expire (within 1 minute)
export const isTokenExpired = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  // Consider expired if within 60 seconds of expiry
  return Date.now() >= parseInt(expiry, 10) - 60000;
};

// Check if user is authenticated (has valid refresh token)
export const isAuthenticated = () => {
  const refreshToken = getRefreshToken();
  const role = localStorage.getItem(ROLE_KEY);
  return !!(refreshToken && role);
};

// Get stored user info
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Get stored role
export const getStoredRole = () => localStorage.getItem(ROLE_KEY);

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Store session data after login/signup
 */
export const setSession = ({ accessToken, refreshToken, expiresIn, role, user, isProfileComplete }) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (expiresIn) {
    // Store expiry time as timestamp
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  if (isProfileComplete !== undefined) {
    localStorage.setItem(IS_PROFILE_COMPLETE_KEY, isProfileComplete.toString());
  }
};

/**
 * Update tokens after refresh
 */
export const updateTokens = ({ accessToken, refreshToken, expiresIn }) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (expiresIn) {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

/**
 * Clear all session data (logout)
 */
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(IS_PROFILE_COMPLETE_KEY);
};

/**
 * Refresh the access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    // Use a separate axios instance to avoid interceptors
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/auth/refresh`,
      { refreshToken },
      { timeout: API_TIMEOUT }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
    
    updateTokens({ accessToken, refreshToken: newRefreshToken, expiresIn });
    
    return accessToken;
  } catch (error) {
    // If refresh fails, clear session and throw
    clearSession();
    throw error;
  }
};

// ==========================================
// AXIOS INTERCEPTORS
// ==========================================

// Helper to delay retry attempts
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryable = (error) => {
  if (!error.response) return true; // Network error
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    // Skip token refresh for auth endpoints
    const isAuthEndpoint = config.url?.includes("/auth/refresh") || 
                           config.url?.includes("/auth/login") ||
                           config.url?.includes("/auth/logout");
    
    if (!isAuthEndpoint) {
      let token = getAccessToken();
      
      // Check if token is expired and we have a refresh token
      if (isTokenExpired() && getRefreshToken()) {
        // If already refreshing, wait for it
        if (isRefreshing) {
          token = await new Promise((resolve, reject) => {
            subscribeToTokenRefresh((newToken, error) => {
              if (error) reject(error);
              else resolve(newToken);
            });
          });
        } else {
          // Start refreshing
          isRefreshing = true;
          try {
            token = await refreshAccessToken();
            onTokenRefreshed(token);
          } catch (error) {
            onRefreshFailed(error);
            throw error;
          } finally {
            isRefreshing = false;
          }
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Track retry count
    config.__retryCount = config.__retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // Handle 401 errors
    if (status === 401) {
      // If token expired, try to refresh
      if (errorCode === "TOKEN_EXPIRED" && getRefreshToken() && !config.__isRetry) {
        config.__isRetry = true;
        
        try {
          // If already refreshing, wait for it
          if (isRefreshing) {
            const newToken = await new Promise((resolve, reject) => {
              subscribeToTokenRefresh((token, err) => {
                if (err) reject(err);
                else resolve(token);
              });
            });
            config.headers.Authorization = `Bearer ${newToken}`;
            return api(config);
          }
          
          // Start refreshing
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          onTokenRefreshed(newToken);
          isRefreshing = false;
          
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshFailed(refreshError);
          
          // Refresh failed, redirect to login
          clearSession();
          const role = getStoredRole() || localStorage.getItem(ROLE_KEY);
          const redirect = role === "merchant" ? "/merchant-login" : "/customer-login";
          if (typeof window !== "undefined") {
            window.location.replace(redirect);
          }
          return Promise.reject(refreshError);
        }
      }
      
      // Other 401 errors (invalid token, etc.) - clear session and redirect
      if (errorCode !== "TOKEN_EXPIRED") {
        clearSession();
        const role = error.response?.data?.role || getStoredRole();
        const redirect = role === "merchant" ? "/merchant-login" : "/customer-login";
        if (typeof window !== "undefined") {
          window.location.replace(redirect);
        }
      }
      
      return Promise.reject(error);
    }

    // Handle 403 errors
    if (status === 403) {
      // Forbidden - user doesn't have permission
      return Promise.reject(error);
    }

    // Retry logic for network/server errors
    if (isRetryable(error) && config && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      console.log(`Retrying request (${config.__retryCount}/${MAX_RETRIES}):`, config.url);
      await delay(RETRY_DELAY * config.__retryCount);
      return api(config);
    }

    // Enhanced error object
    const enhancedError = {
      ...error,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      userMessage: getErrorMessage(error),
    };

    return Promise.reject(enhancedError);
  }
);

// Get user-friendly error message
const getErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;
  
  if (serverMessage) return serverMessage;
  
  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Session expired. Please login again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Resource not found.';
    case 429: return 'Too many requests. Please wait a moment.';
    case 500: return 'Server error. Please try again later.';
    default: return 'Something went wrong. Please try again.';
  }
};

// ==========================================
// AUTH APIs
// ==========================================
export const signupCustomer = (payload) => api.post("/auth/signup/customer", payload);
export const signupMerchant = (payload) => api.post("/auth/signup/merchant", payload);
export const loginUser = (payload) => api.post("/auth/login", payload);
export const requestOtp = (payload) => api.post("/auth/otp/request", payload);
export const verifyOtpCode = (payload) => api.post("/auth/otp/verify", payload);
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);

// Session management APIs
export const refreshToken = (refreshToken) => api.post("/auth/refresh", { refreshToken });
export const logoutUser = (refreshToken) => api.post("/auth/logout", { refreshToken });
export const logoutAllDevices = () => api.post("/auth/logout-all");
export const validateSession = () => api.get("/auth/session");

// ==========================================
// RECEIPT APIs
// ==========================================
export const fetchCustomerReceipts = (page = 1, limit = 50) => 
  api.get(`/receipts/customer?page=${page}&limit=${limit}`);
export const fetchMerchantReceipts = (page = 1, limit = 50) => 
  api.get(`/receipts/merchant?page=${page}&limit=${limit}`);
export const createReceipt = (payload) => api.post("/receipts", payload);
export const claimReceipt = (payload) => api.post("/receipts/claim", payload);
// Mark receipt as paid - MERCHANT ONLY (source of truth for payment)
export const markReceiptPaid = (id, paymentMethod) => 
  api.patch(`/receipts/${id}/mark-paid`, { paymentMethod });
export const updateReceipt = (id, payload) => api.patch(`/receipts/${id}`, payload);
export const deleteReceipt = (id) => api.delete(`/receipts/${id}`);
export const getReceiptById = (id) => api.get(`/receipts/${id}`);
export const fetchCustomerAnalytics = () => api.get("/analytics/customer");
export const fetchMerchantAnalytics = () => api.get("/analytics/merchant");
export const fetchProfile = () => api.get("/auth/me");
export const updateProfile = (payload) => api.patch("/auth/me", payload);
export const changePassword = (payload) => api.post("/auth/change-password", payload);
export const deleteAccount = () => api.delete("/auth/me");

// ==========================================
// MERCHANT ONBOARDING APIs
// ==========================================
export const getOnboardingStatus = () => api.get("/merchant/onboarding/status");
export const saveBusinessInfo = (payload) => api.post("/merchant/onboarding/business-info", payload);
export const saveOperatingHours = (payload) => api.post("/merchant/onboarding/operating-hours", payload);
export const saveOnboardingCategories = (payload) => api.post("/merchant/onboarding/categories", payload);
export const saveOnboardingItems = (payload) => api.post("/merchant/onboarding/items", payload);
export const completeOnboarding = () => api.post("/merchant/onboarding/complete");
export const skipOnboarding = () => api.post("/merchant/onboarding/skip");
export const getMerchantFullProfile = () => api.get("/merchant/profile/full");

// ==========================================
// CATEGORY APIs
// ==========================================
export const fetchCategories = () => api.get("/merchant/categories");
export const createCategory = (payload) => api.post("/merchant/categories", payload);
export const updateCategory = (id, payload) => api.patch(`/merchant/categories/${id}`, payload);
export const deleteCategory = (id, reassignTo = null) => 
  api.delete(`/merchant/categories/${id}${reassignTo ? `?reassignTo=${reassignTo}` : ''}`);
export const reorderCategories = (categoryIds) => api.patch("/merchant/categories/reorder", { categoryIds });

// ==========================================
// ITEM APIs
// ==========================================
export const fetchItems = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  const queryString = queryParams.toString();
  return api.get(`/merchant/items${queryString ? `?${queryString}` : ''}`);
};
export const fetchItemById = (id) => api.get(`/merchant/items/${id}`);
export const createItem = (payload) => api.post("/merchant/items", payload);
export const createItemsBulk = (items) => api.post("/merchant/items/bulk", { items });
export const updateItem = (id, payload) => api.patch(`/merchant/items/${id}`, payload);
export const deleteItem = (id, permanent = false) => 
  api.delete(`/merchant/items/${id}${permanent ? '?permanent=true' : ''}`);
export const toggleItemAvailability = (id, isAvailable) => 
  api.patch(`/merchant/items/${id}/availability`, { isAvailable });
export const reorderItems = (itemIds) => api.patch("/merchant/items/reorder", { itemIds });

export default api;
