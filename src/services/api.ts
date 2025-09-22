import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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

// Settings API
export const settingsAPI = {
  // Get UI preferences
  getUIPreferences: async () => {
    const response = await apiClient.get('/settings/ui-preferences');
    return response.data;
  },

  // Save UI preferences
  saveUIPreferences: async (preferences: any) => {
    const response = await apiClient.post('/settings/ui-preferences', preferences);
    return response.data;
  },

  // Get all settings
  getAllSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  // Update specific setting
  updateSetting: async (key: string, value: any) => {
    const response = await apiClient.patch('/settings', { [key]: value });
    return response.data;
  },

  // Reset settings to defaults
  resetSettings: async () => {
    const response = await apiClient.post('/settings/reset');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: any) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  // Get analytics data
  getAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/analytics', { params });
    return response.data;
  },

  // Get widget usage stats
  getWidgetUsage: async () => {
    const response = await apiClient.get('/analytics/widget-usage');
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  // Get all events
  getEvents: async (params?: { type?: string; limit?: number }) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  // Create new event
  createEvent: async (event: any) => {
    const response = await apiClient.post('/events', event);
    return response.data;
  },

  // Update event
  updateEvent: async (id: string, event: any) => {
    const response = await apiClient.put(`/events/${id}`, event);
    return response.data;
  },

  // Delete event
  deleteEvent: async (id: string) => {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  },
};

// Yoga Plans API
export const yogaPlansAPI = {
  // Get all yoga plans
  getPlans: async () => {
    const response = await apiClient.get('/yoga-plans');
    return response.data;
  },

  // Get single plan
  getPlan: async (id: string) => {
    const response = await apiClient.get(`/yoga-plans/${id}`);
    return response.data;
  },

  // Create new plan
  createPlan: async (plan: any) => {
    const response = await apiClient.post('/yoga-plans', plan);
    return response.data;
  },

  // Update plan
  updatePlan: async (id: string, plan: any) => {
    const response = await apiClient.put(`/yoga-plans/${id}`, plan);
    return response.data;
  },

  // Delete plan
  deletePlan: async (id: string) => {
    const response = await apiClient.delete(`/yoga-plans/${id}`);
    return response.data;
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
    const response = await apiClient.post('/ai-generation/plan', params);
    return response.data;
  },

  // Generate class description
  generateClassDescription: async (params: {
    type?: string;
    level?: string;
    duration?: number;
  }) => {
    const response = await apiClient.post('/ai-generation/class-description', params);
    return response.data;
  },
};

export default apiClient;