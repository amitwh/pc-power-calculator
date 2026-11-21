import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CloseButton } from '@/components/ui/CloseButton';
import { submitMessage, type FeedbackType } from '@/lib/forms/message';

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 1500;
const MIN_SUBJECT = 3;
const MIN_MESSAGE = 10;

const TYPE_OPTIONS: Array<{ value: FeedbackType; label: string }> = [
  { value: 'bug', label: 'Bug report' },
  { value: 'idea', label: 'Feature idea' },
  { value: 'content', label: 'Content correction' },
  { value: 'general', label: 'General feedback' },
];

const INPUT =
  'w-full min-h-11 rounded-8 border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50';
const LABEL = 'text-sm font-semibold';

interface FormState {
  type: FeedbackType;
  subject: string;
  message: string;
  email: string;
  website: string;
}

const EMPTY_FORM: FormState = {
  type: 'bug',
  subject: '',
  message: '',
  email: '',
  website: '',
};

function labelForType(type: FeedbackType): string {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'General feedback';
}

/** Human-readable copy of every non-empty field, for the clipboard fallback. */
function copyText(form: FormState): string {
  const fields = [
    `Type: ${labelForType(form.type)}`,
    `Subject: ${form.subject.trim()}`,
    form.email.trim() ? `Email: ${form.email.trim()}` : '',
  ].filter(Boolean);

  return [...fields, '', 'Message:', '', form.message.trim()].join('\n');
}

export default function Feedback() {
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
    const message = form.message.trim().slice(0, MAX_MESSAGE);
    if (subject.length < MIN_SUBJECT) {
      setStatus('Add a subject of at least 3 characters before sending.');
      return;
    }
    if (message.length < MIN_MESSAGE) {
      setStatus('Add at least 10 characters of feedback before sending.');
      return;
    }

    setSending(true);
    setStatus('');
    try {
      await submitMessage({
        kind: 'feedback',
        type: form.type,
        subject,
        message,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        page: window.location.pathname,
        website: form.website,
      });
      setForm(EMPTY_FORM);
      setStatus('Thanks — your feedback was sent.');
    } catch (error) {
      setStatus(
        error instanceof Error && error.message
          ? error.message
          : 'The feedback could not be sent. Please try again.',
      );
    } finally {
      setSending(false);
    }
  }

  async function copyDetails(): Promise<void> {
    if (!form.subject.trim() || !form.message.trim()) {
      setStatus('Add a subject and message before copying.');
      return;
    }

    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(copyText(form));
      setStatus('Copied the feedback to your clipboard.');
    } catch {
      setStatus('Could not copy automatically — select the message and copy it manually.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Send feedback"
          lede="Found a bug, have an idea, or spotted something that looks wrong? Tell the ConcreteInfo team."
        />
        <CloseButton />
      </div>

      <Card>
        <CardTitle>What would you like to tell us?</CardTitle>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Your feedback is sent directly to ConcreteInfo. Please don&apos;t include sensitive
          information.
        </p>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="feedback-type">
              Type
            </label>
            <Select
              id="feedback-type"
              name="type"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(event) => update('type', event.target.value as FeedbackType)}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="feedback-subject">
              Subject
            </label>
            <input
              id="feedback-subject"
              name="subject"
              type="text"
              required
              minLength={MIN_SUBJECT}
              maxLength={MAX_SUBJECT}
              value={form.subject}
              onChange={(event) => update('subject', event.target.value)}
              placeholder="A short summary"
              className={INPUT}
            />
            <span className="text-xs text-gray-500">
              {form.subject.length}/{MAX_SUBJECT}
            </span>
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="feedback-message">
              Message
            </label>
            <textarea
              id="feedback-message"
              name="message"
              required
              minLength={MIN_MESSAGE}
              maxLength={MAX_MESSAGE}
              rows={6}
              value={form.message}
              onChange={(event) => update('message', event.target.value)}
              placeholder="What happened, what did you expect, and which page were you on?"
              className={`${INPUT} min-h-32 py-2`}
            />
            <span className="text-xs text-gray-500">
              {form.message.length}/{MAX_MESSAGE}
            </span>
          </div>

          <div className="grid gap-1.5">
            <label className={LABEL} htmlFor="feedback-email">
              Your email (optional, so we can reply — never published)
            </label>
            <input
              id="feedback-email"
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
            <label htmlFor="feedback-website">Website</label>
            <input
              id="feedback-website"
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
              {sending ? 'Sending…' : 'Send feedback'}
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
