import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, OAuthStrategy } from '@wix/sdk';
import { dashboard } from '@wix/dashboard';
import { site } from '@wix/site';

// Import WixWindow type
interface WixWindow extends Window {
  Wix?: {
    Dashboard?: any;
    getSiteInfo?: () => any;
    getInstanceId?: () => string;
    getComponentId?: () => string;
    openModal?: (url: string, width: number, height: number) => void;
    navigateToComponent?: (compId: string, params?: any) => void;
  };
  wixDevelopersAnalytics?: any;
}

interface WixContextType {
  wixClient: any;
  instance: string | null;
  compId: string | null;
  isWixEnvironment: boolean;
  dashboardSDK: any;
}

const WixContext = createContext<WixContextType>({
  wixClient: null,
  instance: null,
  compId: null,
  isWixEnvironment: false,
  dashboardSDK: null,
});

export const useWix = () => useContext(WixContext);

interface WixProviderProps {
  children: React.ReactNode;
}

export const WixProvider: React.FC<WixProviderProps> = ({ children }) => {
  const [wixClient, setWixClient] = useState<any>(null);
  const [instance, setInstance] = useState<string | null>(null);
  const [compId, setCompId] = useState<string | null>(null);
  const [isWixEnvironment, setIsWixEnvironment] = useState(false);
  const [dashboardSDK, setDashboardSDK] = useState<any>(null);

  useEffect(() => {
    const initWix = async () => {
      try {
        // Check if we're in a Wix environment first
        const isInWix = window.parent !== window || !!(window as WixWindow).Wix;
        setIsWixEnvironment(isInWix);

        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const appDefinitionId = urlParams.get('appDefinitionId');
        const applicationId = urlParams.get('applicationId');
        let urlCompId = urlParams.get('compId') || urlParams.get('comp_id');
        let urlInstance = urlParams.get('instance');

        // For Settings Panel in Wix Editor - use Wix SDK to get instance
        if (isInWix && (window as any).Wix) {
          try {
            // Settings panel specific methods
            const wix = (window as any).Wix;

            // Get instance ID for settings panel
            if (wix.Settings && wix.Settings.getInstanceId) {
              const instanceId = wix.Settings.getInstanceId();
              if (instanceId) {
                urlInstance = instanceId;
                console.log('Got instance from Wix Settings SDK:', instanceId);
              }
            }

            // Try to get site instance
            if (!urlInstance && wix.getInstanceId) {
              const instanceId = wix.getInstanceId();
              if (instanceId) {
                urlInstance = instanceId;
                console.log('Got instance from Wix getInstanceId:', instanceId);
              }
            }

            // Get component info
            if (!urlCompId && wix.getComponentInfo) {
              const compInfo = wix.getComponentInfo();
              if (compInfo && compInfo.compId) {
                urlCompId = compInfo.compId;
                console.log('Got compId from component info:', compInfo.compId);
              }
            }

            // Get site info for additional context
            if (wix.getSiteInfo) {
              const siteInfo = wix.getSiteInfo();
              console.log('Site info:', siteInfo);
              if (siteInfo && siteInfo.siteId && !urlInstance) {
                // Use siteId as part of instance if no instance found
                urlInstance = `site_${siteInfo.siteId}`;
              }
            }
          } catch (e) {
            console.log('Error getting Wix SDK data:', e);
          }
        }

        // Use appDefinitionId as fallback for compId if not found
        if (!urlCompId && appDefinitionId) {
          urlCompId = appDefinitionId;
          console.log('Using appDefinitionId as compId:', appDefinitionId);
        }

        // Store parameters if found
        if (urlCompId) {
          setCompId(urlCompId);
          sessionStorage.setItem('wixCompId', urlCompId);
          console.log('Stored compId:', urlCompId);
        }

        if (urlInstance) {
          setInstance(urlInstance);
          sessionStorage.setItem('wixInstance', urlInstance);
          console.log('Stored instance:', urlInstance);
        }

        // If still no instance but we have appDefinitionId, generate a tenant key
        if (!urlInstance && appDefinitionId) {
          // Use a combination of appDefinitionId and applicationId as tenant identifier
          const tenantKey = `${appDefinitionId}_${applicationId || 'default'}`;
          setInstance(tenantKey);
          sessionStorage.setItem('wixInstance', tenantKey);
          console.log('Generated tenant key:', tenantKey);
        }

        if (isInWix && (window as WixWindow).Wix?.Dashboard) {
          // Try to initialize Wix Dashboard SDK
          try {
            const sdk = dashboard.host();
            setDashboardSDK(sdk);

            // Try to get component ID using Wix methods (as fallback if not in URL)
            const wixObj = (window as WixWindow).Wix;
            if (!urlCompId && wixObj?.getComponentId) {
              const componentId = wixObj.getComponentId();
              if (componentId) {
                setCompId(componentId);
                sessionStorage.setItem('wixCompId', componentId);
                console.log('Got compId from Wix SDK:', componentId);
              }
            }

            // Try to get instance using Wix methods (as fallback if not in URL)
            if (!urlInstance && wixObj?.getInstanceId) {
              const instanceId = wixObj.getInstanceId();
              if (instanceId) {
                setInstance(instanceId);
                sessionStorage.setItem('wixInstance', instanceId);
                console.log('Got instance from Wix SDK:', instanceId);
              }
            }
          } catch (sdkError) {
            console.log('Could not initialize Dashboard SDK:', sdkError);
          }
        }

        // Initialize Wix Client with OAuth strategy (only in Wix environment)
        if (isInWix) {
          try {
            const client = createClient({
              auth: OAuthStrategy({
                clientId: process.env.REACT_APP_WIX_CLIENT_ID || '',
              }),
              modules: {
                site,
              },
            });

            // Try to get tokens from the instance
            if (urlInstance) {
              // The instance parameter contains authentication info
              await client.auth.parseFromUrl();
            }

            setWixClient(client);
          } catch (error) {
            console.log('Could not initialize Wix client, running in iframe mode');
          }
        }
      } catch (error) {
        console.error('Error initializing Wix:', error);
      }
    };

    initWix();

    // Listen for Wix SDK ready event
    const handleWixReady = () => {
      console.log('Wix SDK is ready');
      initWix();
    };

    window.addEventListener('wixSDKReady', handleWixReady);

    return () => {
      window.removeEventListener('wixSDKReady', handleWixReady);
    };
  }, []);

  return (
    <WixContext.Provider
      value={{
        wixClient,
        instance,
        compId,
        isWixEnvironment,
        dashboardSDK,
      }}
    >
      {children}
    </WixContext.Provider>
  );
};