import '@testing-library/jest-dom';
import { vi } from 'vitest';
import catalogData from '@/data/components.json';
import { __setCatalogForTests } from '@/lib/data/components';

// The app lazy-loads the catalog at bootstrap (main.tsx). Tests exercise sync
// accessors directly, so seed the same data statically here.
__setCatalogForTests(
  catalogData as unknown as {
    components: import('@/types/component').Component[];
    version: string;
    lastUpdated: string;
  },
);

// Deterministic, network-free default: IP-geolocation lookups fail fast in
// tests instead of hitting ipapi.co from jsdom. Individual tests that exercise
// the geo client stub their own fetch.
vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
