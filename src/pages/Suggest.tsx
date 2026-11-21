import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CloseButton } from '@/components/ui/CloseButton';
import { submitMessage, type SuggestionType } from '@/lib/forms/message';

const MAX_SUBJECT = 120;
const MAX_DETAILS = 1500;
const MIN_SUBJECT = 3;
const MIN_DETAILS = 10;

const TYPE_OPTIONS: Array<{ value: SuggestionType; label: string }> = [
  { value: 'part-correction', label: 'Correction to an existing part' },
  { value: 'new-part', label: 'New part' },
  { value: 'country-tariff', label: 'New country or tariff' },
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
  email: string;
  website: string;
}

const EMPTY_FORM: FormState = {
  type: 'part-correction',
  subject: '',
  category: '',
  ratedWatts: '',
  sourceUrl: '',
  details: '',
  email: '',
  website: '',
};

function labelForType(type: SuggestionType): string {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Something else';
}

function labelForCategory(value: string): string {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? 'Not specified';
}

/** Human-readable copy of every non-empty field, for the clipboard fallback. */
function copyText(form: FormState): string {
  const fields = [
    `Type: ${labelForType(form.type)}`,
    `Subject: ${form.subject.trim()}`,
    form.category ? `Category: ${labelForCategory(form.category)}` : '',
    form.ratedWatts ? `Rated watts: ${form.ratedWatts} W` : '',
    form.sourceUrl.trim() ? `Source URL: ${form.sourceUrl.trim()}` : '',
    form.email.trim() ? `Email: ${form.email.trim()}` : '',
  ].filter(Boolean);

  return [...fields, '', 'Details:', '', form.details.trim()].join('\n');
}

export default function Suggest() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (sending) return;

    const subject = form.subject.trim().slice(0, MAX_SUBJECT);
    const details = form.details.trim().slice(0, MAX_DETAILS);
    if (subject.length < MIN_SUBJECT) {
      setStatus('Add a subject of at least 3 characters before sending.');
      return;
    }
    if (details.length < MIN_DETAILS) {
      setStatus('Add at least 10 characters of details before sending.');
      return;
    }

    setSending(true);
    setStatus('');
    try {
      const ratedWatts = Number(form.ratedWatts);
      await submitMessage({
        kind: 'suggestion',
        type: form.type,
        subject,
        details,
        ...(form.category ? { category: form.category } : {}),
        ...(form.ratedWatts.trim() && Number.isFinite(ratedWatts) ? { watts: ratedWatts } : {}),
        ...(form.sourceUrl.trim() ? { sourceUrl: form.sourceUrl.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        page: window.location.pathname,
        website: form.website,
      });
      setForm(EMPTY_FORM);
      setStatus('Thanks — your suggestion was sent.');
    } catch (error) {
      setStatus(
        error instanceof Error && error.message
          ? error.message
          : 'The suggestion could not be sent. Please try again.',
      );
    } finally {
      setSending(false);
    }
  }

  async function copyDetails(): Promise<void> {
    if (!form.subject.trim() || !form.details.trim()) {
      setStatus('Add a subject and details before copying.');
      return;
    }

    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(copyText(form));
      setStatus('Copied the suggestion details to your clipboard.');
    } catch {
      setStatus('Could not copy automatically — select the details and copy them manually.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Suggest a part or correction"
          lede="Found a missing component, a wrong rated wattage, or a tariff that should be in the catalog? Send it straight to the ConcreteInfo team."
        />
        <CloseButton />
      </div>

      <Card>
        <CardTitle>What would you like to add?</CardTitle>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Your suggestion is sent directly to ConcreteInfo. Please don&apos;t include sensitive
          information.
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
              minLength={MIN_SUBJECT}
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
              minLength={MIN_DETAILS}
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

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="suggest-email">
              Your email (optional, so we can reply — never published)
            </label>
            <input
              id="suggest-email"
              name="email"
              type="email"
              maxLength={200}
              autoComplete="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="you@example.com"
              className={INPUT}
            />
          </div>

          {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="suggest-website">Website</label>
            <input
              id="suggest-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => update('website', event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send suggestion'}
            </Button>
            <Button type="button" variant="secondary" onClick={copyDetails}>
              Copy details
            </Button>
          </div>

          <div aria-live="polite" className="text-sm text-gray-600 dark:text-gray-400">
            {status && <p>{status}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}
