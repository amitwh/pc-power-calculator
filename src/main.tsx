import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initCatalog } from './lib/data/components';
import './lib/export/print.css';

// The hardware catalog ships as its own chunk (~1 MB of JSON); load it before
// the first render so every sync data accessor is safe. On failure, still
// render — the pickers will be empty and the console shows the reason.
initCatalog()
  .catch((err) => console.error('Failed to load the hardware catalog:', err))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
