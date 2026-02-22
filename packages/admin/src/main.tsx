import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary, OfflineIndicator } from '@reprieve/shared';
import App from './App';
import '@reprieve/shared/styles/globals.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineIndicator />
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
