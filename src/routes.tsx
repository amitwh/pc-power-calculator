import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Compare from '@/pages/Compare';
import Suggestions from '@/pages/Suggestions';
import DataFreshness from '@/pages/DataFreshness';
import About from '@/pages/About';

// Route tree only — no router wrapper. App.tsx wraps this in <HashRouter>
// so the app uses hash URLs (#/compare) for static-host friendliness.
// Tests wrap this in <MemoryRouter initialEntries={...}> to control location.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/compare" element={<Layout><Compare /></Layout>} />
      <Route path="/suggestions" element={<Layout><Suggestions /></Layout>} />
      <Route path="/data" element={<Layout><DataFreshness /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
    </Routes>
  );
}
