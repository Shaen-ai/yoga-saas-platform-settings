/**
 * Wix Integration Helper
 * Handles communication between the settings panel and widget using Wix SDK
 */

import { createClient } from '@wix/sdk';
import { widget, editor } from '@wix/editor';

let wixClient: ReturnType<typeof createClient> | null = null;
let instanceToken: string | null = null;
let compId: string | null = null;
let isInitialized = false;

// Extract instance token from URL on module load
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const urlInstance = urlParams.get('instance');
  if (urlInstance) {
    instanceToken = urlInstance;
    console.log('[Yoga Settings] 🔑 Instance token extracted from URL');
  } else {
    console.warn('[Yoga Settings] ⚠️ No instance token in URL - will rely on wixClient.fetchWithAuth');
  }
}

// ----------------------
// Utility to generate a unique component ID
// ----------------------
function generateCompId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const timestamp = Date.now();
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `comp-${timestamp}-${randomPart}`;
}

// ----------------------
// Initialize Wix clients
// ----------------------
export async function initializeWixClient(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    console.log('[Yoga Settings] 🔄 Initializing Wix client...');

    // Create Wix client with editor.host() and widget module
    wixClient = createClient({
      host: editor.host(),
      auth: editor.auth(),
      modules: { widget }
    });

    console.log('[Yoga Settings] ✅ Wix client created');

    // Try to get existing compId and instance from widget props (persisted site data)
    if (wixClient.widget && wixClient.widget.getProp) {
      try {
        const existingCompId = await wixClient.widget.getProp('compId');
        if (existingCompId) {
          compId = existingCompId as string;
          console.log('[Yoga Settings] ✅ Got existing compId from site data:', compId);
        }

        // Try to get instance token from widget props
        const existingInstance = await wixClient.widget.getProp('instance');
        if (existingInstance && !instanceToken) {
          instanceToken = existingInstance as string;
          console.log('[Yoga Settings] ✅ Got instance token from widget props');
        }
      } catch (e) {
        console.warn('[Yoga Settings] ⚠️ Could not read props from site data:', e);
      }
    }

    // If no compId exists, generate one and save it to widget props (site data)
    if (!compId) {
      compId = generateCompId();
      console.log('[Yoga Settings] 🆕 Generated new compId:', compId);

      if (wixClient.widget && wixClient.widget.setProp) {
        try {
          await wixClient.widget.setProp('compId', compId);
          console.log('[Yoga Settings] ✅ Saved compId to site data');
        } catch (e) {
          console.error('[Yoga Settings] ❌ Could not save compId to site data:', e);
        }
      }
    }

    // Log authentication status
    console.log('[Yoga Settings] 🔑 Authentication status:', {
      hasInstanceToken: !!instanceToken,
      hasCompId: !!compId,
      hasWixClient: !!wixClient,
      hasWixFetchWithAuth: !!(wixClient?.fetchWithAuth)
    });

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Yoga Settings] ❌ Wix SDK init failed:', error);

    // Fallback: generate compId even if Wix SDK fails
    if (!compId) {
      compId = generateCompId();
      console.log('[Yoga Settings] 🔄 Fallback: Generated compId:', compId);
    }

    isInitialized = true;
    return false;
  }
}

// ----------------------
// Authenticated fetch
// ----------------------
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add compId header only
  if (compId) {
    headers['X-Wix-Comp-Id'] = compId;
  }

  const fetchOptions: RequestInit = { ...options, headers };

  // Use wixClient.fetchWithAuth - it handles authentication
  if (wixClient?.fetchWithAuth) {
    console.log('[Yoga Settings] 📤 wixClient.fetchWithAuth:', url);
    return await wixClient.fetchWithAuth(url, fetchOptions);
  }

  // Fallback
  console.warn('[Yoga Settings] ⚠️ No Wix client');
  return fetch(url, fetchOptions);
}

// ----------------------
// Update widget configuration
// ----------------------
export async function updateWidgetConfig(config: Record<string, any>, onlyChanged = false): Promise<boolean> {
  if (!wixClient || !wixClient.widget || !wixClient.widget.setProp) {
    console.error('[Yoga Settings] ❌ Wix client or widget.setProp not available');
    return false;
  }

  // If onlyChanged is true, only update the properties that are actually in the config object
  // Otherwise, use all properties from config
  const props = config;

  try {
    console.log('[Yoga Settings] 📤 Calling widget.setProp for properties:', props);

    // Set each property individually using setProp (singular)
    for (const [key, value] of Object.entries(props)) {
      await wixClient.widget.setProp(key, value);
    }

    console.log('[Yoga Settings] ✅ widget.setProp completed successfully for', Object.keys(props).length, 'properties');
    return true;
  } catch (error) {
    console.error('[Yoga Settings] ❌ Failed to update widget config:', error);
    return false;
  }
}

// ----------------------
// Exports (for external modules)
// ----------------------
export function setInstanceToken(token: string): void {
  instanceToken = token;
}

export function setCompId(id: string): void {
  compId = id;
}

export function getCompId(): string | null {
  return compId;
}

export function getInstanceToken(): string | null {
  return instanceToken;
}

// ----------------------
// Generate dashboard URL
// ----------------------
export function getDashboardUrl(baseUrl: string = 'https://yoga-dashboard.nextechspires.com/'): string {
  const url = new URL(baseUrl);
  if (instanceToken) url.searchParams.set('instance', instanceToken);
  if (compId) url.searchParams.set('compId', compId);
  return url.toString();
}

// ----------------------
// Auto-initialize on module load
// ----------------------
if (typeof window !== 'undefined') {
  initializeWixClient();
}
