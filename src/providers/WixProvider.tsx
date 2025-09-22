import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, OAuthStrategy } from '@wix/sdk';
import { dashboard } from '@wix/dashboard';
import { site } from '@wix/site';

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
        // Check if we're in a Wix environment
        const isInWix = window.parent !== window || !!window.Wix;
        setIsWixEnvironment(isInWix);

        if (isInWix) {
          // Initialize Wix Dashboard SDK if available
          if (window.Wix?.Dashboard) {
            const sdk = await dashboard.getHost();
            setDashboardSDK(sdk);

            // Get component ID
            const componentId = await sdk.dashboard.getComponentId?.();
            if (componentId) {
              setCompId(componentId);
              sessionStorage.setItem('wixCompId', componentId);
            }

            // Get instance
            const instanceId = await sdk.dashboard.getInstanceId?.();
            if (instanceId) {
              setInstance(instanceId);
              sessionStorage.setItem('wixInstance', instanceId);
            }
          }

          // Alternative: Try to get from URL params
          const urlParams = new URLSearchParams(window.location.search);
          const urlCompId = urlParams.get('compId') || urlParams.get('comp_id');
          const urlInstance = urlParams.get('instance');

          if (!compId && urlCompId) {
            setCompId(urlCompId);
            sessionStorage.setItem('wixCompId', urlCompId);
          }

          if (!instance && urlInstance) {
            setInstance(urlInstance);
            sessionStorage.setItem('wixInstance', urlInstance);
          }

          // Initialize Wix Client with OAuth strategy
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
        } else {
          // Not in Wix, check for stored values (for development)
          const storedCompId = sessionStorage.getItem('wixCompId');
          const storedInstance = sessionStorage.getItem('wixInstance');

          if (storedCompId) setCompId(storedCompId);
          if (storedInstance) setInstance(storedInstance);
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