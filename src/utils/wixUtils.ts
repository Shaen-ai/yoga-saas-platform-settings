/**
 * Utility functions for handling Wix integration
 */

interface WixParams {
  compId?: string;
  instance?: string;
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
 * Priority: 1) Cached auth info from API, 2) Session storage, 3) URL params
 */
export const buildDashboardUrl = (baseUrl?: string): string => {
  const dashboardUrl = baseUrl || process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3002';

  // Priority 1: Use cached auth info from API response (most reliable)
  const authInfo = getAuthInfo();

  // Priority 2: Try to get from session storage (set by WixProvider or setAuthInfo)
  const storedCompId = sessionStorage.getItem('wixCompId');
  const storedInstance = sessionStorage.getItem('wixInstance');

  // Priority 3: Fallback to URL params
  const urlParams = getWixParams();

  // Also check current window location
  const currentUrl = new URL(window.location.href);
  const currentCompId = currentUrl.searchParams.get('compId') || currentUrl.searchParams.get('comp_id');
  const currentInstance = currentUrl.searchParams.get('instance');

  // Use first available source (prioritize auth info from API)
  const compId = authInfo?.compId || storedCompId || urlParams.compId || currentCompId;
  const instance = authInfo?.instanceToken || storedInstance || urlParams.instance || currentInstance;

  // Log for debugging
  console.log('[WixUtils] Building dashboard URL:', {
    dashboardUrl,
    authInfoCompId: authInfo?.compId,
    authInfoInstance: authInfo?.instanceToken ? 'present' : 'null',
    storedCompId,
    storedInstance: storedInstance ? 'present' : 'null',
    urlParams,
    finalCompId: compId,
    finalInstance: instance ? 'present' : 'null'
  });

  if (!compId && !instance) {
    console.warn('[WixUtils] No Wix parameters found anywhere for dashboard URL');

    // Check if we're in an iframe and try to get params from parent
    if (window.parent !== window) {
      try {
        const parentUrl = new URL(document.referrer || window.parent.location.href);
        const parentCompId = parentUrl.searchParams.get('compId') || parentUrl.searchParams.get('comp_id');
        const parentInstance = parentUrl.searchParams.get('instance');

        if (parentCompId || parentInstance) {
          console.log('[WixUtils] Found params in parent frame:', { parentCompId, parentInstance: parentInstance ? 'present' : 'null' });
          const url = new URL(dashboardUrl);
          if (parentCompId) url.searchParams.set('compId', parentCompId);
          if (parentInstance) url.searchParams.set('instance', parentInstance);
          return url.toString();
        }
      } catch (e) {
        console.log('[WixUtils] Could not access parent frame URL:', e);
      }
    }

    // No Wix params at all, return base URL
    return dashboardUrl;
  }

  // Build URL with Wix parameters
  const url = new URL(dashboardUrl);
  if (compId) url.searchParams.set('compId', compId);
  if (instance) url.searchParams.set('instance', instance);
  if (urlParams.viewMode) url.searchParams.set('viewMode', urlParams.viewMode);
  if (urlParams.deviceType) url.searchParams.set('deviceType', urlParams.deviceType);

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