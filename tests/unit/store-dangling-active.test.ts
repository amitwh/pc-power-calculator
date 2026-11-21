/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, test } from 'vitest';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('writes survive a dangling activeBuildId', () => {
  test('changing country still applies to the first build', () => {
    const first = useBuildStore.getState().builds[0];
    // Simulate a saved store whose active build was removed.
    useBuildStore.setState({ activeBuildId: 'gone-forever' });

    useBuildStore.getState().setLocation('US');

    const b = useBuildStore.getState().builds[0];
    expect(b.location.country_iso2).toBe('US');
    // And the active id is repointed rather than left dangling.
    expect(useBuildStore.getState().activeBuildId).toBe(first.id);
  });

  test('other writes recover the same way', () => {
    useBuildStore.setState({ activeBuildId: 'gone-forever' });
    useBuildStore.getState().setIdleHoursPerDay(5);
    expect(useBuildStore.getState().builds[0].idle_hours_per_day).toBe(5);
  });
});
