/**
 * Utility functions for handling Wix integration
 */

interface WixParams {
  compId?: string;
  instance?: string;
  viewMode?: string;
  deviceType?: string;
}

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
 * First checks session storage (set by WixProvider), then URL params
 */
export const buildDashboardUrl = (baseUrl?: string): string => {
  const dashboardUrl = baseUrl || process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3002';

  // Try to get from session storage first (set by WixProvider)
  const storedCompId = sessionStorage.getItem('wixCompId');
  const storedInstance = sessionStorage.getItem('wixInstance');

  // Fallback to URL params
  const urlParams = getWixParams();

  // Also check current window location
  const currentUrl = new URL(window.location.href);
  const currentCompId = currentUrl.searchParams.get('compId') || currentUrl.searchParams.get('comp_id');
  const currentInstance = currentUrl.searchParams.get('instance');

  // Use first available source
  const compId = storedCompId || urlParams.compId || currentCompId;
  const instance = storedInstance || urlParams.instance || currentInstance;

  // Log for debugging
  console.log('Building dashboard URL:', {
    dashboardUrl,
    storedCompId,
    storedInstance,
    urlParams,
    currentCompId,
    currentInstance,
    finalCompId: compId,
    finalInstance: instance,
    currentHref: window.location.href
  });

  if (!compId && !instance) {
    console.warn('No Wix parameters found anywhere for dashboard URL');

    // Check if we're in an iframe and try to get params from parent
    if (window.parent !== window) {
      try {
        const parentUrl = new URL(document.referrer || window.parent.location.href);
        const parentCompId = parentUrl.searchParams.get('compId') || parentUrl.searchParams.get('comp_id');
        const parentInstance = parentUrl.searchParams.get('instance');

        if (parentCompId || parentInstance) {
          console.log('Found params in parent frame:', { parentCompId, parentInstance });
          const url = new URL(dashboardUrl);
          if (parentCompId) url.searchParams.set('compId', parentCompId);
          if (parentInstance) url.searchParams.set('instance', parentInstance);
          return url.toString();
        }
      } catch (e) {
        console.log('Could not access parent frame URL:', e);
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