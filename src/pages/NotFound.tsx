import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';

/**
 * Catch-all page for paths that are not real routes. usePageMeta noindexes
 * them (nginx answers 200 for unknown URLs), so this card carries the
 * user-facing explanation instead of leaving a blank page.
 */
export default function NotFound() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Card>
        <CardTitle>Page not found</CardTitle>
        <p className="text-sm">
          That page doesn't exist.{' '}
          <Link to="/" className="text-brand-text underline underline-offset-2">
            Open the calculator
          </Link>{' '}
          or browse the{' '}
          <Link to="/guides" className="text-brand-text underline underline-offset-2">
            guides
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
