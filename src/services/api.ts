import axios, { AxiosInstance, AxiosError } from 'axios';
import { createClient } from '@wix/sdk';
import { site } from '@wix/site';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Initialize Wix client with site.auth() for automatic token management
let wixClient: any = null;

const getWixClient = () => {
  if (!wixClient) {
    try {
      wixClient = createClient({
        auth: site.auth(),
        modules: { site }
      });
    } catch (error) {
      console.log('Could not initialize Wix client, using fallback');
    }
  }
  return wixClient;
};

// Helper function to get Wix headers
const getWixHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};

  const compId = sessionStorage.getItem('wixCompId') || localStorage.getItem('wixCompId');
  const instance = sessionStorage.getItem('wixInstance') || localStorage.getItem('wixInstance');

  if (compId) headers['X-Wix-Comp-Id'] = compId;
  if (instance) headers['X-Wix-Instance'] = instance;

  // Generate tenant ID from compId and instance
  const tenantId = `${compId || 'default'}_${instance || 'default'}`;
  headers['X-Tenant-Id'] = tenantId;

  return headers;
};

// Helper function to get Wix query parameters
const getWixParams = (): Record<string, string> => {
  const params: Record<string, string> = {};

  const compId = sessionStorage.getItem('wixCompId') || localStorage.getItem('wixCompId');
  const instance = sessionStorage.getItem('wixInstance') || localStorage.getItem('wixInstance');

  if (compId) params.compId = compId;
  if (instance) params.instance = instance;

  return params;
};

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token and Wix headers
apiClient.interceptors.request.use(
  (config) => {
    // Add Wix headers
    const wixHeaders = getWixHeaders();
    Object.assign(config.headers, wixHeaders);

    // Also add Wix params to query string for GET requests (backup)
    if (config.method === 'get') {
      const wixParams = getWixParams();
      config.params = {
        ...config.params,
        ...wixParams
      };
    }

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        params: config.params
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login');
      // You can redirect to login or refresh token here
    }
    return Promise.reject(error);
  }
);

// Use Wix fetchWithAuth if available, otherwise fall back to axios
const makeAuthenticatedRequest = async (url: string, options: any = {}) => {
  const client = getWixClient();

  // Try to use Wix fetchWithAuth first
  if (client && client.fetchWithAuth) {
    try {
      const fullUrl = `${API_URL}${url}`;
      const response = await client.fetchWithAuth(fullUrl, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getWixHeaders(),
          ...options.headers
        },
        body: options.data ? JSON.stringify(options.data) : undefined
      });
      return await response.json();
    } catch (error) {
      console.log('fetchWithAuth failed, falling back to axios:', error);
    }
  }

  // Fallback to axios
  const axiosConfig = {
    url,
    ...options
  };
  const response = await apiClient.request(axiosConfig);
  return response.data;
};

// Settings API
export const settingsAPI = {
  // Get UI preferences
  getUIPreferences: async () => {
    return await makeAuthenticatedRequest('/settings/ui-preferences');
  },

  // Save UI preferences
  saveUIPreferences: async (preferences: any) => {
    return await makeAuthenticatedRequest('/settings/ui-preferences', {
      method: 'POST',
      data: preferences
    });
  },

  // Get all settings
  getAllSettings: async () => {
    return await makeAuthenticatedRequest('/settings');
  },

  // Update specific setting
  updateSetting: async (key: string, value: any) => {
    return await makeAuthenticatedRequest('/settings', {
      method: 'PATCH',
      data: { [key]: value }
    });
  },

  // Reset settings to defaults
  resetSettings: async () => {
    return await makeAuthenticatedRequest('/settings/reset', {
      method: 'POST'
    });
  },
};

// Users API
export const usersAPI = {
  // Get current user
  getCurrentUser: async () => {
    return await makeAuthenticatedRequest('/users/me');
  },

  // Update user profile
  updateProfile: async (data: any) => {
    return await makeAuthenticatedRequest('/users/profile', {
      method: 'PUT',
      data
    });
  },
};

// Analytics API
export const analyticsAPI = {
  // Get analytics data
  getAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return await makeAuthenticatedRequest(`/analytics${queryString}`);
  },

  // Get widget usage stats
  getWidgetUsage: async () => {
    return await makeAuthenticatedRequest('/analytics/widget-usage');
  },
};

// Events API
export const eventsAPI = {
  // Get all events
  getEvents: async (params?: { type?: string; limit?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return await makeAuthenticatedRequest(`/events${queryString}`);
  },

  // Create new event
  createEvent: async (event: any) => {
    return await makeAuthenticatedRequest('/events', {
      method: 'POST',
      data: event
    });
  },

  // Update event
  updateEvent: async (id: string, event: any) => {
    return await makeAuthenticatedRequest(`/events/${id}`, {
      method: 'PUT',
      data: event
    });
  },

  // Delete event
  deleteEvent: async (id: string) => {
    return await makeAuthenticatedRequest(`/events/${id}`, {
      method: 'DELETE'
    });
  },
};

// Yoga Plans API
export const yogaPlansAPI = {
  // Get all yoga plans
  getPlans: async () => {
    return await makeAuthenticatedRequest('/yoga-plans');
  },

  // Get single plan
  getPlan: async (id: string) => {
    return await makeAuthenticatedRequest(`/yoga-plans/${id}`);
  },

  // Create new plan
  createPlan: async (plan: any) => {
    return await makeAuthenticatedRequest('/yoga-plans', {
      method: 'POST',
      data: plan
    });
  },

  // Update plan
  updatePlan: async (id: string, plan: any) => {
    return await makeAuthenticatedRequest(`/yoga-plans/${id}`, {
      method: 'PUT',
      data: plan
    });
  },

  // Delete plan
  deletePlan: async (id: string) => {
    return await makeAuthenticatedRequest(`/yoga-plans/${id}`, {
      method: 'DELETE'
    });
  },
};

// AI Generation API
export const aiGenerationAPI = {
  // Generate yoga plan
  generatePlan: async (params: {
    goals?: string[];
    experience?: string;
    duration?: number;
    frequency?: number;
  }) => {
    return await makeAuthenticatedRequest('/ai-generation/plan', {
      method: 'POST',
      data: params
    });
  },

  // Generate class description
  generateClassDescription: async (params: {
    type?: string;
    level?: string;
    duration?: number;
  }) => {
    return await makeAuthenticatedRequest('/ai-generation/class-description', {
      method: 'POST',
      data: params
    });
  },
};

export default apiClient;