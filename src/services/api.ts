import { fetchWithAuth, getCompId, initializeWixClient } from './wix-integration';
import { AuthInfo } from '../utils/wixUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Type for UI preferences response from backend
interface UIPreferencesResponse {
  layout?: any;
  appearance?: any;
  calendar?: any;
  behavior?: any;
  uiPreferences?: any;
  auth?: AuthInfo;
}

// Initialize Wix client on module load and store the promise
const initPromise = initializeWixClient();

// Helper function to make API requests using fetchWithAuth
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Ensure initialization is complete before making API requests
  await initPromise;

  const url = `${API_URL}${endpoint}`;
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Settings API
export const settingsAPI = {
  // Get UI preferences
  getUIPreferences: async (): Promise<UIPreferencesResponse> => {
    try {
      return await apiRequest<UIPreferencesResponse>('/settings/ui-preferences', { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch UI preferences:', error);
      throw error;
    }
  },

  // Save UI preferences
  saveUIPreferences: async (preferences: any) => {
    try {
      return await apiRequest('/settings/ui-preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Failed to save UI preferences:', error);
      throw error;
    }
  },

  // Get all settings
  getAllSettings: async () => {
    try {
      return await apiRequest('/settings', { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      throw error;
    }
  },

  // Update specific setting
  updateSetting: async (key: string, value: any) => {
    try {
      return await apiRequest('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  },

  // Reset settings to defaults
  resetSettings: async () => {
    try {
      return await apiRequest('/settings/reset', { method: 'POST' });
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
      return await apiRequest('/users/me', { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data: any) => {
    try {
      return await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
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
      const queryString = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : '';
      return await apiRequest(`/analytics${queryString}`, { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  },

  // Get widget usage stats
  getWidgetUsage: async () => {
    try {
      return await apiRequest('/analytics/widget-usage', { method: 'GET' });
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
      const queryString = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : '';
      return await apiRequest(`/events${queryString}`, { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  },

  // Create new event
  createEvent: async (event: any) => {
    try {
      return await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  },

  // Update event
  updateEvent: async (id: string, event: any) => {
    try {
      return await apiRequest(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (id: string) => {
    try {
      return await apiRequest(`/events/${id}`, { method: 'DELETE' });
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
      return await apiRequest('/yoga-plans', { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch yoga plans:', error);
      throw error;
    }
  },

  // Get single plan
  getPlan: async (id: string) => {
    try {
      return await apiRequest(`/yoga-plans/${id}`, { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch yoga plan:', error);
      throw error;
    }
  },

  // Create new plan
  createPlan: async (plan: any) => {
    try {
      return await apiRequest('/yoga-plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
    } catch (error) {
      console.error('Failed to create yoga plan:', error);
      throw error;
    }
  },

  // Update plan
  updatePlan: async (id: string, plan: any) => {
    try {
      return await apiRequest(`/yoga-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plan),
      });
    } catch (error) {
      console.error('Failed to update yoga plan:', error);
      throw error;
    }
  },

  // Delete plan
  deletePlan: async (id: string) => {
    try {
      return await apiRequest(`/yoga-plans/${id}`, { method: 'DELETE' });
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
      return await apiRequest('/ai-generation/plan', {
        method: 'POST',
        body: JSON.stringify(params),
      });
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
      return await apiRequest('/ai-generation/class-description', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (error) {
      console.error('Failed to generate class description:', error);
      throw error;
    }
  },
};

// Premium API
export const premiumAPI = {
  // Get premium status
  getPremiumStatus: async (): Promise<{
    vendorProductId: string | null;
    premiumPlanName: string;
    isPremium: boolean;
  }> => {
    try {
      return await apiRequest('/premium-status', { method: 'GET' });
    } catch (error) {
      console.error('Failed to fetch premium status:', error);
      throw error;
    }
  },
};

export default {
  settingsAPI,
  usersAPI,
  analyticsAPI,
  eventsAPI,
  yogaPlansAPI,
  aiGenerationAPI,
  premiumAPI,
};
