/**
 * Wix Editor SDK Integration
 * Handles communication with Wix Editor for settings panel
 */

import { editor, widget } from '@wix/editor';
import { createClient } from '@wix/sdk';

let wixClient: any = null;
let isInitialized = false;

/**
 * Initialize Wix Editor client
 */
export const initializeWixEditor = () => {
  if (isInitialized) {
    return wixClient;
  }

  try {
    wixClient = createClient({
      host: editor.host(),
      modules: { widget },
    });

    isInitialized = true;
    console.log('Wix Editor client initialized');
    return wixClient;
  } catch (error) {
    console.error('Failed to initialize Wix Editor client:', error);
    return null;
  }
};

/**
 * Get widget properties from Wix Editor
 */
export const getWidgetProps = async () => {
  try {
    const client = initializeWixEditor();
    if (!client) return null;

    // Get all widget properties
    const props = await client.widget.getProps();
    console.log('Widget properties:', props);
    return props;
  } catch (error) {
    console.error('Failed to get widget properties:', error);
    return null;
  }
};

/**
 * Set a widget property
 */
export const setWidgetProp = async (propName: string, value: any) => {
  try {
    const client = initializeWixEditor();
    if (!client) return false;

    await client.widget.setProp(propName, value);
    console.log(`Set widget property ${propName} to:`, value);
    return true;
  } catch (error) {
    console.error(`Failed to set widget property ${propName}:`, error);
    return false;
  }
};

/**
 * Set multiple widget properties at once
 */
export const setWidgetProps = async (props: Record<string, any>) => {
  try {
    const client = initializeWixEditor();
    if (!client) return false;

    // Set each property
    for (const [key, value] of Object.entries(props)) {
      await client.widget.setProp(key, value);
    }

    console.log('Set widget properties:', props);
    return true;
  } catch (error) {
    console.error('Failed to set widget properties:', error);
    return false;
  }
};

/**
 * Get editor context (instance ID, etc.)
 */
export const getEditorContext = async () => {
  try {
    const client = initializeWixEditor();
    if (!client) return null;

    // Try to get editor context
    const context = {
      instanceId: null as string | null,
      siteId: null as string | null,
      locale: null as string | null,
    };

    // Get instance from legacy Wix SDK if available
    if ((window as any).Wix) {
      const wix = (window as any).Wix;

      // Try Settings API
      if (wix.Settings?.getInstanceId) {
        context.instanceId = wix.Settings.getInstanceId();
      } else if (wix.getInstanceId) {
        context.instanceId = wix.getInstanceId();
      }

      // Get site info
      if (wix.getSiteInfo) {
        const siteInfo = wix.getSiteInfo();
        if (siteInfo) {
          context.siteId = siteInfo.siteId || siteInfo.metaSiteId;
          context.locale = siteInfo.locale;
        }
      }
    }

    console.log('Editor context:', context);
    return context;
  } catch (error) {
    console.error('Failed to get editor context:', error);
    return null;
  }
};

/**
 * Listen for settings updates from Wix
 */
export const onSettingsUpdate = (callback: (data: any) => void) => {
  if ((window as any).Wix?.addEventListener && (window as any).Wix?.Events?.SETTINGS_UPDATED) {
    (window as any).Wix.addEventListener(
      (window as any).Wix.Events.SETTINGS_UPDATED,
      callback
    );
  }
};

/**
 * Trigger a refresh in the widget
 */
export const refreshWidget = () => {
  if ((window as any).Wix?.refreshApp) {
    (window as any).Wix.refreshApp();
  }
};

/**
 * Get component info including component ID
 */
export const getComponentInfo = () => {
  if ((window as any).Wix?.getComponentInfo) {
    return (window as any).Wix.getComponentInfo();
  }
  return null;
};