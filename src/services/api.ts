import axios, { AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function to get Wix headers
const getWixHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Always use 'default' for Wix headers
  headers['X-Wix-Comp-Id'] = 'default';
  headers['X-Wix-Instance'] = 'default';
  headers['X-Tenant-Id'] = 'default_default';

  return headers;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for auth token and Wix headers
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Wix headers for tenant isolation
    const wixHeaders = getWixHeaders();
    Object.assign(config.headers, wixHeaders);

    // Also add as query params for GET requests (backup)
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        compId: 'default',
        instance: 'default'
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error: No response from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Settings API
export const settingsAPI = {
  // Get UI preferences
  getUIPreferences: async () => {
    try {
      const response = await api.get('/settings/ui-preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch UI preferences:', error);
      throw error;
    }
  },

  // Save UI preferences
  saveUIPreferences: async (preferences: any) => {
    try {
      const response = await api.post('/settings/ui-preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to save UI preferences:', error);
      throw error;
    }
  },

  // Get all settings
  getAllSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  },

  // Update specific setting
  updateSetting: async (key: string, value: any) => {
    try {
      const response = await api.patch('/settings', { [key]: value });
      return response.data;
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  },

  // Reset settings to defaults
  resetSettings: async () => {
    try {
      const response = await api.post('/settings/reset');
      return response.data;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data: any) => {
    try {
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  // Get analytics data
  getAnalytics: async (params?: { startDate?: string; endDate?: string }) => {
    try {
      const response = await api.get('/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  },

  // Get widget usage stats
  getWidgetUsage: async () => {
    try {
      const response = await api.get('/analytics/widget-usage');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch widget usage:', error);
      throw error;
    }
  },
};

// Events API
export const eventsAPI = {
  // Get all events
  getEvents: async (params?: { type?: string; limit?: number }) => {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  },

  // Create new event
  createEvent: async (event: any) => {
    try {
      const response = await api.post('/events', event);
      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  },

  // Update event
  updateEvent: async (id: string, event: any) => {
    try {
      const response = await api.put(`/events/${id}`, event);
      return response.data;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (id: string) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  },
};

// Yoga Plans API
export const yogaPlansAPI = {
  // Get all yoga plans
  getPlans: async () => {
    try {
      const response = await api.get('/yoga-plans');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch yoga plans:', error);
      throw error;
    }
  },

  // Get single plan
  getPlan: async (id: string) => {
    try {
      const response = await api.get(`/yoga-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch yoga plan:', error);
      throw error;
    }
  },

  // Create new plan
  createPlan: async (plan: any) => {
    try {
      const response = await api.post('/yoga-plans', plan);
      return response.data;
    } catch (error) {
      console.error('Failed to create yoga plan:', error);
      throw error;
    }
  },

  // Update plan
  updatePlan: async (id: string, plan: any) => {
    try {
      const response = await api.put(`/yoga-plans/${id}`, plan);
      return response.data;
    } catch (error) {
      console.error('Failed to update yoga plan:', error);
      throw error;
    }
  },

  // Delete plan
  deletePlan: async (id: string) => {
    try {
      const response = await api.delete(`/yoga-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete yoga plan:', error);
      throw error;
    }
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
    try {
      const response = await api.post('/ai-generation/plan', params);
      return response.data;
    } catch (error) {
      console.error('Failed to generate yoga plan:', error);
      throw error;
    }
  },

  // Generate class description
  generateClassDescription: async (params: {
    type?: string;
    level?: string;
    duration?: number;
  }) => {
    try {
      const response = await api.post('/ai-generation/class-description', params);
      return response.data;
    } catch (error) {
      console.error('Failed to generate class description:', error);
      throw error;
    }
  },
};

export default api;