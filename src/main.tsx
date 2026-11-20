import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { initCatalog } from './lib/data/components';
import './lib/export/print.css';

// The hardware catalog ships as its own chunk (~1 MB of JSON); load it before
// the first render so every sync data accessor is safe. On failure, still
// render — the pickers will be empty and the console shows the reason.
initCatalog()
  .catch((err) => console.error('Failed to load the hardware catalog:', err))
  .finally(() => {
    const root = document.getElementById('root')!;
    const app = (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // `data-prerendered` is set by scripts/prerender.mjs on every route it
    // builds; the dev server shell (boot splash) lacks it, so dev keeps using
    // createRoot and never tries to hydrate markup React did not produce.
    if (root.dataset.prerendered === 'true') {
      hydrateRoot(root, app);
    } else {
      createRoot(root).render(app);
    }
  });
