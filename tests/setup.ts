import '@testing-library/jest-dom';
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
