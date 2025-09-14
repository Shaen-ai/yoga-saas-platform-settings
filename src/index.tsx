import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleSettings from './SimpleSettings';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SimpleSettings />
  </React.StrictMode>
);