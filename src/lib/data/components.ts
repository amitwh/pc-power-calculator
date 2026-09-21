import data from '@/data/components.json';
import type { Component, ComponentCategory } from '@/types/component';

const all = (data as unknown as { components: Component[] }).components;

export function listComponents(category?: ComponentCategory): Component[] {
  return category ? all.filter((c) => c.category === category) : all;
}

export function findComponent(id: string): Component | undefined {
  return all.find((c) => c.id === id);
}

export function dataVersion(): string {
  return (data as { version: string }).version;
}

export function dataLastUpdated(): string {
  return (data as { lastUpdated: string }).lastUpdated;
}
