import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Compare from '@/pages/Compare';
import Suggestions from '@/pages/Suggestions';
import Suggest from '@/pages/Suggest';
import Feedback from '@/pages/Feedback';
import DataFreshness from '@/pages/DataFreshness';
import About from '@/pages/About';
import Privacy from '@/pages/Privacy';
import Guides from '@/pages/Guides';
import Part from '@/pages/Part';
import Cost from '@/pages/Cost';
import NotFound from '@/pages/NotFound';

// Route tree only — App.tsx wraps this in <BrowserRouter> (real paths like
// /compare work thanks to the nginx SPA fallback + PWA navigateFallback;
// migrated from HashRouter on 2026-11-05 so guides get indexable URLs).
// Tests wrap this in <MemoryRouter initialEntries={...}> to control location.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      {/* Permanent shared build: the config lives in the URL, so this renders
          the calculator with that build imported (nginx SPA fallback serves the
          prerendered home shell; the import runs after hydration). */}
      <Route path="/build/:token" element={<Layout><Home /></Layout>} />
      <Route path="/compare" element={<Layout><Compare /></Layout>} />
      <Route path="/suggestions" element={<Layout><Suggestions /></Layout>} />
      <Route path="/suggest" element={<Layout><Suggest /></Layout>} />
      <Route path="/feedback" element={<Layout><Feedback /></Layout>} />
      <Route path="/data" element={<Layout><DataFreshness /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
      <Route path="/guides" element={<Layout><Guides /></Layout>} />
      <Route path="/guides/:slug" element={<Layout><Guides /></Layout>} />
      <Route path="/parts/:id" element={<Layout><Part /></Layout>} />
      <Route path="/cost/:country" element={<Layout><Cost /></Layout>} />
      <Route path="/cost/:country/:state" element={<Layout><Cost /></Layout>} />
      {/* Catch-all last: unknown URLs render NotFound instead of a blank page. */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}
