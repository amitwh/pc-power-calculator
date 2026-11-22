/// <reference types="vitest/globals" />
import { describe, expect, test, beforeEach } from 'vitest';
import { usePickerStore } from '@/store/pickerStore';

beforeEach(() => {
  usePickerStore.getState().clear();
});

describe('pickerStore — transient "open the picker on X" request', () => {
  test('request sets the category and bumps the nonce', () => {
    const before = usePickerStore.getState().nonce;
    usePickerStore.getState().request('psu');
    expect(usePickerStore.getState().category).toBe('psu');
    expect(usePickerStore.getState().nonce).toBe(before + 1);
  });

  test('requesting the same category twice bumps the nonce again', () => {
    usePickerStore.getState().request('psu');
    const afterFirst = usePickerStore.getState().nonce;
    usePickerStore.getState().request('psu');
    expect(usePickerStore.getState().category).toBe('psu');
    expect(usePickerStore.getState().nonce).toBe(afterFirst + 1);
  });

  test('clear resets the category', () => {
    usePickerStore.getState().request('psu');
    usePickerStore.getState().clear();
    expect(usePickerStore.getState().category).toBeNull();
  });

  test('a request writes nothing to localStorage — the store is transient UI state', () => {
    localStorage.clear();
    usePickerStore.getState().request('psu');
    expect(localStorage.length).toBe(0);
  });
});
