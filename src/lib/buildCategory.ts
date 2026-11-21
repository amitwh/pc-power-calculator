import type { BuildCategory } from '@/types/build';

/** Every system type, in the order the picker and the report present them. */
export const BUILD_CATEGORIES: BuildCategory[] = [
  'general',
  'gaming',
  'content',
  'workstation',
  'ai',
  'homelab',
  'nas',
  'web',
  'database',
];

/** Short label for a system type, in the term the industry actually uses. */
export const CATEGORY_LABEL: Record<BuildCategory, string> = {
  general: 'General desktop',
  gaming: 'Gaming PC',
  content: 'Content creation',
  workstation: 'CAD workstation',
  ai: 'AI / ML workstation',
  homelab: 'Home lab',
  nas: 'NAS / storage',
  web: 'Web server',
  database: 'Database server',
};

/** Longer description used where there is room for one line of explanation. */
export const CATEGORY_DESCRIPTION: Record<BuildCategory, string> = {
  general: 'Email, browsing and office work at a desk',
  gaming: 'A GPU-led build with a gaming schedule',
  content: 'Video editing, rendering and photography',
  workstation: 'CAD, simulation and engineering work',
  ai: 'Model training or local inference on a GPU',
  homelab: 'A hypervisor host running several services',
  nas: 'Storage array, on most of the day',
  web: 'An application or web host, answering requests',
  database: 'A database server with sustained load',
};

/** Emoji kept only for plain-text surfaces (selects, exports). */
export const CATEGORY_EMOJI: Record<BuildCategory, string> = {
  general: '🖥️',
  gaming: '🎮',
  content: '🎬',
  workstation: '📐',
  ai: '🤖',
  homelab: '🧪',
  nas: '🗄️',
  web: '🌐',
  database: '🗃️',
};

export function emojiFor(category: BuildCategory | undefined): string {
  return category ? CATEGORY_EMOJI[category] : '🖥️';
}

export function labelFor(category: BuildCategory | undefined): string {
  return category ? CATEGORY_LABEL[category] : CATEGORY_LABEL.general;
}
