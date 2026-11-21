/// <reference types="vitest/globals" />
// @ts-expect-error - the server is plain ESM and ships no TypeScript declarations.
import { cleanText, validateMessage } from '../../../server/validate.mjs';

function suggestion(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'suggestion',
    type: 'part-correction',
    subject: 'Ryzen 7 7800X3D',
    details: 'The listed package power is not the wall draw.',
    ...overrides,
  };
}

function feedback(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'feedback',
    type: 'bug',
    subject: 'Export button does nothing',
    message: 'Clicking export on Firefox downloads an empty file.',
    ...overrides,
  };
}

describe('cleanText', () => {
  test('trims, normalises newlines and strips control characters', () => {
    expect(cleanText('  A\u0000B\u0007C  ')).toBe('ABC');
    expect(cleanText('line one\r\nline two')).toBe('line one\nline two');
    expect(cleanText('a\tb')).toBe('a\tb');
    expect(cleanText(42)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });
});

describe('validateMessage — suggestions', () => {
  test('accepts a valid minimal suggestion', () => {
    const result = validateMessage(suggestion());

    expect(result.ok).toBe(true);
    expect(result.honeypot).toBe(false);
    expect(result.value).toMatchObject({
      kind: 'suggestion',
      type: 'part-correction',
      subject: 'Ryzen 7 7800X3D',
      details: 'The listed package power is not the wall draw.',
    });
    expect(result.value.watts).toBeUndefined();
    expect(result.value.email).toBeUndefined();
  });

  test('accepts and normalises every optional field', () => {
    const result = validateMessage(
      suggestion({
        type: 'new-part',
        category: 'gpu',
        watts: 65,
        sourceUrl: 'https://example.com/spec',
        email: 'person@example.com',
        page: '/suggest',
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      type: 'new-part',
      category: 'gpu',
      watts: 65,
      sourceUrl: 'https://example.com/spec',
      email: 'person@example.com',
      page: '/suggest',
    });
  });

  test('coerces a numeric watts string and drops a blank one', () => {
    expect(validateMessage(suggestion({ watts: '65' })).value.watts).toBe(65);
    expect(validateMessage(suggestion({ watts: '   ' })).value.watts).toBeUndefined();
  });

  test.each(['part-correction', 'new-part', 'country-tariff', 'other'])(
    'accepts the %s type',
    (type) => {
      expect(validateMessage(suggestion({ type })).ok).toBe(true);
    },
  );

  test('rejects an unknown suggestion type', () => {
    const result = validateMessage(suggestion({ type: 'correction' }));
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'type', reason: 'enum' });
  });

  test('rejects missing or short details', () => {
    expect(validateMessage(suggestion({ details: undefined })).ok).toBe(false);
    expect(validateMessage(suggestion({ details: 'too short' })).ok).toBe(false);
    expect(validateMessage(suggestion({ details: '123456789' })).detail.field).toBe('details');
  });

  test('rejects details over 1,500 characters', () => {
    const result = validateMessage(suggestion({ details: 'a'.repeat(1501) }));
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'details', reason: 'length' });
  });

  test('rejects a subject outside 3–120 characters', () => {
    expect(validateMessage(suggestion({ subject: 'ab' })).ok).toBe(false);
    expect(validateMessage(suggestion({ subject: 'a'.repeat(121) })).ok).toBe(false);
    expect(validateMessage(suggestion({ subject: 'abc' })).ok).toBe(true);
    expect(validateMessage(suggestion({ subject: undefined })).detail.field).toBe('subject');
  });

  test('rejects a category over 40 characters', () => {
    const result = validateMessage(suggestion({ category: 'c'.repeat(41) }));
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'category', reason: 'length' });
  });

  test.each([-1, 5001, 'not-a-number', Number.NaN])(
    'rejects invalid watts %s',
    (watts) => {
      const result = validateMessage(suggestion({ watts }));
      expect(result.ok).toBe(false);
      expect(result.detail).toEqual({ field: 'watts', reason: 'range' });
    },
  );

  test.each(['ftp://example.com/spec', 'example.com/spec', 'javascript:alert(1)'])(
    'rejects non-http source URL %s',
    (sourceUrl) => {
      const result = validateMessage(suggestion({ sourceUrl }));
      expect(result.ok).toBe(false);
      expect(result.detail).toEqual({ field: 'sourceUrl', reason: 'format' });
    },
  );

  test('rejects a source URL over 500 characters', () => {
    const sourceUrl = `https://example.com/${'a'.repeat(500)}`;
    const result = validateMessage(suggestion({ sourceUrl }));
    expect(result.ok).toBe(false);
    expect(result.detail.field).toBe('sourceUrl');
  });

  test('rejects an invalid or over-long email', () => {
    expect(validateMessage(suggestion({ email: 'not-an-email' })).detail).toEqual({
      field: 'email',
      reason: 'format',
    });
    expect(validateMessage(suggestion({ email: `${'a'.repeat(195)}@x.com` })).ok).toBe(false);
    expect(validateMessage(suggestion({ email: 'person@example.com' })).ok).toBe(true);
  });

  test('rejects a page over 200 characters', () => {
    const result = validateMessage(suggestion({ page: `/${'p'.repeat(200)}` }));
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'page', reason: 'length' });
  });

  test('trims and strips control characters before measuring', () => {
    const result = validateMessage(
      suggestion({ subject: '  Bad\u0000Subject  ', details: '  Clean\u0007 details here.  ' }),
    );
    expect(result.ok).toBe(true);
    expect(result.value.subject).toBe('BadSubject');
    expect(result.value.details).toBe('Clean details here.');
  });
});

describe('validateMessage — feedback', () => {
  test('accepts a valid feedback message', () => {
    const result = validateMessage(feedback({ email: 'person@example.com' }));

    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      kind: 'feedback',
      type: 'bug',
      subject: 'Export button does nothing',
      message: 'Clicking export on Firefox downloads an empty file.',
      email: 'person@example.com',
    });
  });

  test.each(['bug', 'idea', 'content', 'general'])('accepts the %s type', (type) => {
    expect(validateMessage(feedback({ type })).ok).toBe(true);
  });

  test('rejects an unknown feedback type', () => {
    const result = validateMessage(feedback({ type: 'part-correction' }));
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'type', reason: 'enum' });
  });

  test('rejects a missing or short message', () => {
    expect(validateMessage(feedback({ message: undefined })).ok).toBe(false);
    expect(validateMessage(feedback({ message: 'short' })).detail).toEqual({
      field: 'message',
      reason: 'length',
    });
  });

  test('rejects a message over 1,500 characters', () => {
    const result = validateMessage(feedback({ message: 'a'.repeat(1501) }));
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'message', reason: 'length' });
  });
});

describe('validateMessage — body and honeypot', () => {
  test('rejects non-object bodies', () => {
    for (const body of [null, undefined, 'text', 42, [], true]) {
      expect(validateMessage(body).ok).toBe(false);
    }
  });

  test('rejects an unknown kind', () => {
    const result = validateMessage({ ...suggestion(), kind: 'contact' });
    expect(result.ok).toBe(false);
    expect(result.detail).toEqual({ field: 'kind', reason: 'enum' });
  });

  test('a filled honeypot succeeds without a value, even when other fields are invalid', () => {
    const result = validateMessage({ website: 'https://spam.example' });

    expect(result).toEqual({ ok: true, honeypot: true, value: null });
  });

  test('an empty or whitespace honeypot is treated as empty', () => {
    expect(validateMessage(suggestion({ website: '' })).honeypot).toBe(false);
    expect(validateMessage(suggestion({ website: '   ' })).honeypot).toBe(false);
  });
});
