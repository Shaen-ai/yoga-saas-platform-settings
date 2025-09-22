// Wix global type definitions

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

declare global {
  interface Window extends WixWindow {}
}