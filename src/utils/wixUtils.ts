/**
 * Utility functions for handling Wix integration
 */

interface WixParams {
  compId?: string;
  instance?: string;
  instanceId?: string;
  viewMode?: string;
  deviceType?: string;
}

export interface AuthInfo {
  instanceId?: string | null;
  compId?: string | null;
  instanceToken?: string | null;
  isAuthenticated?: boolean;
}

// Store auth info from API response
let cachedAuthInfo: AuthInfo | null = null;

/**
 * Store auth info from API response (called when loading settings)
 */
export const setAuthInfo = (authInfo: AuthInfo): void => {
  cachedAuthInfo = authInfo;
  // Also store in session storage for persistence
  if (authInfo.compId) {
    sessionStorage.setItem('wixCompId', authInfo.compId);
  }
  if (authInfo.instanceToken) {
    sessionStorage.setItem('wixInstance', authInfo.instanceToken);
  }
  console.log('[WixUtils] Auth info stored:', {
    compId: authInfo.compId,
    instanceToken: authInfo.instanceToken ? 'present' : 'null',
    isAuthenticated: authInfo.isAuthenticated
  });
};

/**
 * Get cached auth info
 */
export const getAuthInfo = (): AuthInfo | null => cachedAuthInfo;

/**
 * Extract Wix parameters from URL
 */
export const getWixParams = (): WixParams => {
  const params = new URLSearchParams(window.location.search);

  return {
    compId: params.get('compId') || params.get('comp_id') || undefined,
    instance: params.get('instance') || undefined,
    instanceId: params.get('instanceId') || params.get('instance_id') || undefined,
    viewMode: params.get('viewMode') || params.get('view_mode') || undefined,
    deviceType: params.get('deviceType') || params.get('device_type') || undefined,
  };
};

/**
 * Check if app is running in Wix environment
 */
export const isWixEnvironment = (): boolean => {
  const params = getWixParams();
  // Check for Wix-specific parameters or if we're in an iframe
  return !!(params.instance || params.compId || window.parent !== window);
};

/**
 * Store Wix parameters in session storage
 */
export const storeWixParams = (): void => {
  const params = getWixParams();
  if (params.compId || params.instance) {
    sessionStorage.setItem('wixParams', JSON.stringify(params));
  }
};

/**
 * Get stored Wix parameters from session storage
 */
export const getStoredWixParams = (): WixParams | null => {
  const stored = sessionStorage.getItem('wixParams');
  return stored ? JSON.parse(stored) : null;
};

/**
 * Build dashboard URL with Wix parameters
 * Like Mapsy: accepts optional authInfo from API response as first priority
 */
export const buildDashboardUrl = (authInfo?: AuthInfo): string => {
  const dashboardUrl = process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3002';

  // Use auth info from parameter (API response) or fall back to cached/URL
  const effectiveAuthInfo = authInfo || getAuthInfo();

  // Get compId: from API auth info first, then URL params
  const urlParams = getWixParams();
  const compId = effectiveAuthInfo?.compId || urlParams.compId;

  // Get instance token: from API auth info first, then URL params
  const instance = effectiveAuthInfo?.instanceToken || urlParams.instance;

  // Get instanceId: from API auth info (used for upgrade URL)
  const instanceId = effectiveAuthInfo?.instanceId;

  // Log for debugging
  console.log('[WixUtils] Building dashboard URL:', {
    dashboardUrl,
    authInfoCompId: effectiveAuthInfo?.compId,
    authInfoInstance: effectiveAuthInfo?.instanceToken ? 'present' : 'null',
    authInfoInstanceId: effectiveAuthInfo?.instanceId || 'null',
    urlParamsCompId: urlParams.compId,
    urlParamsInstance: urlParams.instance ? 'present' : 'null',
    finalCompId: compId,
    finalInstance: instance ? 'present' : 'null',
    finalInstanceId: instanceId || 'null'
  });

  // Build URL with Wix parameters
  const url = new URL(dashboardUrl);
  if (compId) url.searchParams.set('compId', compId);
  if (instance) url.searchParams.set('instance', instance);
  if (instanceId) url.searchParams.set('instanceId', instanceId);

  return url.toString();
};

/**
 * Decode Wix instance for getting user/site info
 * Note: In production, this should be verified on the backend
 */
export const decodeWixInstance = (instance: string): any => {
  try {
    // Wix instance is base64 encoded JSON with signature
    const [encodedData] = instance.split('.');
    const decodedData = atob(encodedData);
    return JSON.parse(decodedData);
  } catch (error) {
    console.error('Failed to decode Wix instance:', error);
    return null;
  }
};