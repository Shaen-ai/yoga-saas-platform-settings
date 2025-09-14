import React from 'react';
import ReactDOM from 'react-dom/client';
import WixApp from './WixApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <WixApp />
  </React.StrictMode>
);