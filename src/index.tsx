import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WixProvider } from './providers/WixProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <WixProvider>
      <App />
    </WixProvider>
  </React.StrictMode>
);