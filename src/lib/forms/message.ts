export type SuggestionType = 'part-correction' | 'new-part' | 'country-tariff' | 'other';
export type FeedbackType = 'bug' | 'idea' | 'content' | 'general';

export interface SuggestionPayload {
  kind: 'suggestion';
  type: SuggestionType;
  subject: string;
  category?: string;
  watts?: number;
  sourceUrl?: string;
  details: string;
  email?: string;
  page?: string;
  /** Hidden field; real users leave it empty. */
  website?: string;
}

export interface FeedbackPayload {
  kind: 'feedback';
  type: FeedbackType;
  subject: string;
  message: string;
  email?: string;
  page?: string;
  /** Hidden field; real users leave it empty. */
  website?: string;
}

export type MessagePayload = SuggestionPayload | FeedbackPayload;

const ENDPOINT = '/api/v1/messages';
const FALLBACK_ERROR = 'The message could not be sent. Please try again.';

/** Read the API's `{error,message,detail}` envelope, or fall back to a safe line. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string' &&
      (body as { message: string }).message.trim()
    ) {
      return (body as { message: string }).message.trim();
    }
  } catch {
    // A non-JSON error page tells us nothing useful; use the fallback.
  }
  return FALLBACK_ERROR;
}

/**
 * POST a suggestion or feedback message. Resolves only on HTTP 200; every other
 * outcome throws an Error carrying the API's human-readable message.
 */
export async function submitMessage(payload: MessagePayload): Promise<void> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (response.status !== 200) {
    throw new Error(await errorMessage(response));
  }
}
