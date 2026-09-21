import type { BuildCategory } from '@/types/build';

export const CATEGORY_EMOJI: Record<BuildCategory, string> = {
  gaming: '⚡',
  workstation: '💼',
  nas: '🗄️',
  ai: '🤖',
  general: '🖥️',
};

export const CATEGORY_LABEL: Record<BuildCategory, string> = {
  gaming: 'Gaming',
  workstation: 'Workstation',
  nas: 'NAS',
  ai: 'AI',
  general: 'General',
};

export function emojiFor(category: BuildCategory | undefined): string {
  return category ? CATEGORY_EMOJI[category] : '🖥️';
}
