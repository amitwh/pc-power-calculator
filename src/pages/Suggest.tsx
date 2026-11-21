import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const REPO_URL = 'https://github.com/amitwh/pc-power-calculator';
const ISSUE_URL = `${REPO_URL}/issues/new`;

const MAX_SUBJECT = 120;
const MAX_DETAILS = 1500;

type SuggestionType = 'correction' | 'new_part' | 'new_country' | 'other';

const TYPE_OPTIONS: Array<{ value: SuggestionType; label: string }> = [
  { value: 'correction', label: 'Correction to an existing part' },
  { value: 'new_part', label: 'New part' },
  { value: 'new_country', label: 'New country or tariff' },
  { value: 'other', label: 'Something else' },
];

const CATEGORY_OPTIONS = [
  { value: 'cpu', label: 'CPU' },
  { value: 'gpu', label: 'GPU' },
  { value: 'ram', label: 'RAM' },
  { value: 'storage', label: 'Storage' },
  { value: 'motherboard', label: 'Motherboard' },
  { value: 'psu', label: 'PSU' },
  { value: 'cooler', label: 'Cooler' },
  { value: 'fan', label: 'Fan' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'add_in_card', label: 'Add-in card' },
  { value: 'optical_drive', label: 'Optical drive' },
  { value: 'ups', label: 'UPS' },
  { value: 'peripheral', label: 'Peripheral' },
  { value: 'not_sure', label: 'Not sure' },
];

const INPUT =
  'w-full min-h-11 rounded-8 border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50';
const LABEL = 'text-sm font-semibold';

interface FormState {
  type: SuggestionType;
  subject: string;
  category: string;
  ratedWatts: string;
  sourceUrl: string;
  details: string;
}

const EMPTY_FORM: FormState = {
  type: 'correction',
  subject: '',
  category: '',
  ratedWatts: '',
  sourceUrl: '',
  details: '',
};

function labelForType(type: SuggestionType): string {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Something else';
}

function labelForCategory(value: string): string {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? 'Not specified';
}

function issueTitle(form: FormState, subject: string): string {
  return `[Suggestion] ${labelForType(form.type)}: ${subject}`;
}

/** Markdown body containing every non-empty field, ready for GitHub's prefill. */
function issueBody(form: FormState, subject: string, details: string): string {
  return [
    `**Type:** ${labelForType(form.type)}`,
    `**Category:** ${labelForCategory(form.category)}`,
    `**Subject:** ${subject}`,
    `**Rated watts:** ${form.ratedWatts ? `${form.ratedWatts} W` : '—'}`,
    `**Source URL:** ${form.sourceUrl.trim() || '—'}`,
    '',
    '### Details',
    '',
    details,
  ].join('\n');
}

export default function Suggest() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const subject = form.subject.trim().slice(0, MAX_SUBJECT);
    const details = form.details.trim().slice(0, MAX_DETAILS);
    if (!subject || !details) {
      setFallbackUrl(null);
      setStatus('Add a subject and details before opening an issue.');
      return;
    }

    const title = issueTitle(form, subject);
    const body = issueBody(form, subject, details);
    const params = new URLSearchParams({ title, body });
    const url = `${ISSUE_URL}?${params.toString()}`;

    setFallbackUrl(null);
    // `noopener` makes window.open return null even when the tab opens, so a
    // null result cannot be read as "blocked". Always show the manual link
    // alongside the honest status rather than guessing.
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) {
      setStatus('Opened a prefilled GitHub issue — review and submit it there.');
    } else {
      setFallbackUrl(url);
      setStatus(
        'Opened a prefilled GitHub issue — review and submit it there. If no tab appeared, open it with the link below.',
      );
    }
  }

  async function copyDetails(): Promise<void> {
    const subject = form.subject.trim().slice(0, MAX_SUBJECT);
    const details = form.details.trim().slice(0, MAX_DETAILS);
    if (!subject || !details) {
      setStatus('Add a subject and details before copying.');
      return;
    }

    const text = `${issueTitle(form, subject)}\n\n${issueBody(form, subject, details)}`;
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setStatus('Copied the suggestion details to your clipboard.');
    } catch {
      setStatus('Could not copy automatically — select the details and copy them manually.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader
        title="Suggest a part or correction"
        lede="Found a missing component, a wrong rated wattage, or a tariff that should be in the catalog? Send it through the public issue tracker."
      />

      <Card>
        <CardTitle>What would you like to add?</CardTitle>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          This opens a public GitHub issue in a new tab. Don&apos;t include personal information.
        </p>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-type">
              Type
            </label>
            <Select
              id="suggest-type"
              name="type"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(event) => update('type', event.target.value as SuggestionType)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-subject">
              Subject
            </label>
            <input
              id="suggest-subject"
              name="subject"
              type="text"
              required
              maxLength={MAX_SUBJECT}
              value={form.subject}
              onChange={(event) => update('subject', event.target.value)}
              placeholder="Brand and model, or country/state"
              className={INPUT}
            />
            <span className="text-xs text-gray-500">
              {form.subject.length}/{MAX_SUBJECT}
            </span>
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-category">
              Category
            </label>
            <Select
              id="suggest-category"
              name="category"
              options={CATEGORY_OPTIONS}
              placeholder="Select a category"
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-watts">
              Rated watts <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="suggest-watts"
              name="ratedWatts"
              type="number"
              min={0}
              max={5000}
              inputMode="numeric"
              value={form.ratedWatts}
              onChange={(event) => update('ratedWatts', event.target.value)}
              placeholder="e.g. 65"
              className={INPUT}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-source">
              Source URL <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="suggest-source"
              name="sourceUrl"
              type="url"
              value={form.sourceUrl}
              onChange={(event) => update('sourceUrl', event.target.value)}
              placeholder="https://manufacturer.example/spec-sheet"
              className={INPUT}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-details">
              Details
            </label>
            <textarea
              id="suggest-details"
              name="details"
              required
              maxLength={MAX_DETAILS}
              rows={6}
              value={form.details}
              onChange={(event) => update('details', event.target.value)}
              placeholder="What is wrong, what is missing, and where did you find the correct figure?"
              className={`${INPUT} min-h-32 py-2`}
            />
            <span className="text-xs text-gray-500">
              {form.details.length}/{MAX_DETAILS}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Open GitHub issue</Button>
            <Button type="button" variant="secondary" onClick={copyDetails}>
              Copy details
            </Button>
          </div>

          <div aria-live="polite" className="text-sm text-gray-600 dark:text-gray-400">
            {status && <p>{status}</p>}
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-text font-semibold underline underline-offset-2"
              >
                Open the prefilled issue on GitHub
              </a>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
