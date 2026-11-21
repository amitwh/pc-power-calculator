/**
 * Formatting helpers shared by the guide bodies.
 *
 * Why: the rupee helper was a private const inside the old monolithic
 * `src/pages/Guides.tsx`. Splitting the articles into one file each means
 * every file that quotes a price needs it, so it lives here instead of being
 * copied nine times.
 */
export const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;
