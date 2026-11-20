/// <reference types="vitest/globals" />
import { describe, expect, test, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCalc } from '@/hooks/useCalc';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

const CPU = 'cpu-amd-ryzen-7-7800x3d';
const GPU = 'gpu-nvidia-rtx-4070';
const PSU = 'psu-bequiet-pure-power-11-600w';
const MONITOR = 'monitor-alienware-aw3423dwf';

function seedBuild() {
  const store = useBuildStore.getState();
  store.setComponent('cpu', CPU);
  store.setComponent('gpu', GPU);
  store.setComponent('psu', PSU);
}

describe('useCalc — PSU sizing', () => {
  test('a wall-side monitor does not inflate the PSU recommendation', () => {
    seedBuild();
    const { result } = renderHook(() => useCalc());
    const withoutMonitor = result.current.recommendedPsuW;

    act(() => {
      useBuildStore.getState().addComponent('monitor', MONITOR);
    });

    expect(result.current.recommendedPsuW).toBe(withoutMonitor);
    // Sized from the 330 W PSU-side component draw, not the ~427 W wall total
    // (which would have recommended 600 W).
    expect(withoutMonitor).toBe(450);
  });
});
