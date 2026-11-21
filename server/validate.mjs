// Pure request validation for POST /api/v1/messages.
//
// Kept free of HTTP and SMTP concerns so the rules can be unit-tested without
// binding a socket. Every string is trimmed and stripped of control characters
// before its length is measured, so pasted text with invisible bytes cannot
// sneak past a cap.

// eslint-disable-next-line no-control-regex -- removing control bytes is the point.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SUGGESTION_TYPES = new Set(['part-correction', 'new-part', 'country-tariff', 'other']);
const FEEDBACK_TYPES = new Set(['bug', 'idea', 'content', 'general']);

/** Trim, normalise line endings, and drop control characters (newlines stay). */
export function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').trim();
}

function isHttpUrl(value) {
  if (/\s/.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function invalid(message, field, reason) {
  return { ok: false, message, detail: { field, reason } };
}

/**
 * Validate a parsed JSON body.
 *
 * Returns `{ ok: true, honeypot, value }` or `{ ok: false, message, detail }`.
 * A filled honeypot is reported as success with no value so the caller can
 * answer 200 without sending anything or revealing the trap.
 */
export function validateMessage(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return invalid('Request body must be a JSON object.', 'body', 'object');
  }

  // Honeypot: only a real person leaves this hidden field empty.
  if (cleanText(raw.website)) {
    return { ok: true, honeypot: true, value: null };
  }

  const kind = cleanText(raw.kind);
  if (kind !== 'suggestion' && kind !== 'feedback') {
    return invalid('Choose a valid message kind.', 'kind', 'enum');
  }

  const subject = cleanText(raw.subject);
  if (subject.length < 3 || subject.length > 120) {
    return invalid('Subject must be between 3 and 120 characters.', 'subject', 'length');
  }

  const email = cleanText(raw.email);
  if (email && (email.length > 200 || !EMAIL_RE.test(email))) {
    return invalid('Email address is not valid.', 'email', 'format');
  }

  const page = cleanText(raw.page);
  if (page.length > 200) {
    return invalid('Page must be 200 characters or fewer.', 'page', 'length');
  }

  if (kind === 'suggestion') {
    const type = cleanText(raw.type);
    if (!SUGGESTION_TYPES.has(type)) {
      return invalid('Choose a valid suggestion type.', 'type', 'enum');
    }

    const details = cleanText(raw.details);
    if (details.length < 10 || details.length > 1500) {
      return invalid('Details must be between 10 and 1,500 characters.', 'details', 'length');
    }

    const category = cleanText(raw.category);
    if (category.length > 40) {
      return invalid('Category must be 40 characters or fewer.', 'category', 'length');
    }

    let watts;
    if (raw.watts !== undefined && raw.watts !== null) {
      const candidate = typeof raw.watts === 'number' ? raw.watts : cleanText(raw.watts);
      if (candidate !== '') {
        const numeric = typeof candidate === 'number' ? candidate : Number(candidate);
        if (!Number.isFinite(numeric) || numeric < 0 || numeric > 5000) {
          return invalid('Rated watts must be between 0 and 5,000.', 'watts', 'range');
        }
        watts = numeric;
      }
    }

    const sourceUrl = cleanText(raw.sourceUrl);
    if (sourceUrl && (sourceUrl.length > 500 || !isHttpUrl(sourceUrl))) {
      return invalid(
        'Source URL must be a valid http(s) link of 500 characters or fewer.',
        'sourceUrl',
        'format',
      );
    }

    return {
      ok: true,
      honeypot: false,
      value: {
        kind,
        type,
        subject,
        ...(category ? { category } : {}),
        ...(watts !== undefined ? { watts } : {}),
        ...(sourceUrl ? { sourceUrl } : {}),
        details,
        ...(email ? { email } : {}),
        ...(page ? { page } : {}),
      },
    };
  }

  const type = cleanText(raw.type);
  if (!FEEDBACK_TYPES.has(type)) {
    return invalid('Choose a valid feedback type.', 'type', 'enum');
  }

  const message = cleanText(raw.message);
  if (message.length < 10 || message.length > 1500) {
    return invalid('Message must be between 10 and 1,500 characters.', 'message', 'length');
  }

  return {
    ok: true,
    honeypot: false,
    value: {
      kind,
      type,
      subject,
      message,
      ...(email ? { email } : {}),
      ...(page ? { page } : {}),
    },
  };
}
