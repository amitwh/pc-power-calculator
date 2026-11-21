/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { confidenceFor } from '@/lib/data/confidence';

describe('confidenceFor', () => {
  test('vendor documentation is a manufacturer spec', () => {
    expect(confidenceFor('amd.com').level).toBe('manufacturer');
    expect(confidenceFor('intel-ark').level).toBe('manufacturer');
    expect(confidenceFor('vendor-spec').level).toBe('manufacturer');
  });

  test('a review database is an independent measurement', () => {
    expect(confidenceFor('techpowerup').level).toBe('independent');
  });

  test('our own numbers are labelled as estimates, never as spec', () => {
    expect(confidenceFor('estimate').level).toBe('estimated');
    expect(confidenceFor('').level).toBe('estimated');
    expect(confidenceFor(undefined).level).toBe('estimated');
    expect(confidenceFor('something-unknown').level).toBe('estimated');
  });

  test('community submissions are their own class', () => {
    expect(confidenceFor('community-submitted').level).toBe('community');
  });
});
