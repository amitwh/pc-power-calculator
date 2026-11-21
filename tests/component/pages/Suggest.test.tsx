/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Suggest from '@/pages/Suggest';

function renderPage() {
  return render(
    <MemoryRouter>
      <Suggest />
    </MemoryRouter>,
  );
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function submitPayload(call: [RequestInfo | URL, RequestInit?] | undefined) {
  expect(call).toBeDefined();
  const [url, init] = call!;
  expect(url).toBe('/api/v1/messages');
  expect(init?.method).toBe('POST');
  expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/suggest form', () => {
  test('renders every field, the email field, the honeypot and the direct-send note', () => {
    const { container } = renderPage();

    expect(
      screen.getByRole('heading', { name: /Suggest a part or correction/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Type$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Category$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rated watts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Details$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your email/i)).toBeInTheDocument();
    expect(screen.getByText(/sent directly to ConcreteInfo/i)).toBeInTheDocument();
    expect(screen.getByText(/sensitive information/i)).toBeInTheDocument();

    const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  test('a valid submit posts to the endpoint and reports success', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, { ok: true }));

    renderPage();

    await user.type(screen.getByLabelText(/^Subject$/i), 'AMD Ryzen 7 7800X3D');
    await user.selectOptions(screen.getByLabelText(/^Category$/i), 'cpu');
    await user.type(screen.getByLabelText(/Rated watts/i), '120');
    await user.type(screen.getByLabelText(/Source URL/i), 'https://example.com/spec');
    await user.type(
      screen.getByLabelText(/^Details$/i),
      'The listed TDP is the package power, not the wall draw.',
    );
    await user.type(screen.getByLabelText(/Your email/i), 'person@example.com');
    await user.click(screen.getByRole('button', { name: /Send suggestion/i }));

    expect(await screen.findByText('Thanks — your suggestion was sent.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const payload = submitPayload(fetchMock.mock.calls[0]);
    expect(payload).toMatchObject({
      kind: 'suggestion',
      type: 'part-correction',
      subject: 'AMD Ryzen 7 7800X3D',
      category: 'cpu',
      watts: 120,
      sourceUrl: 'https://example.com/spec',
      details: 'The listed TDP is the package power, not the wall draw.',
      email: 'person@example.com',
      website: '',
    });

    // The form is cleared only after a confirmed 200.
    expect(screen.getByLabelText(/^Subject$/i)).toHaveValue('');
    expect(screen.getByLabelText(/^Details$/i)).toHaveValue('');
  });

  test('an API error shows its message, keeps the form and never claims success', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(500, {
        error: 'INTERNAL_ERROR',
        message: 'Email is not configured. Set SMTP_USER and SMTP_PASSWORD.',
        detail: {},
      }),
    );

    renderPage();

    await user.type(screen.getByLabelText(/^Subject$/i), 'Kerala tariff');
    await user.type(screen.getByLabelText(/^Details$/i), 'Add the 2026 KSEB slabs.');
    await user.click(screen.getByRole('button', { name: /Send suggestion/i }));

    expect(
      await screen.findByText('Email is not configured. Set SMTP_USER and SMTP_PASSWORD.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/suggestion was sent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Thanks/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject$/i)).toHaveValue('Kerala tariff');
    // The clipboard fallback remains available after a failure.
    expect(screen.getByRole('button', { name: /Copy details/i })).toBeInTheDocument();
  });

  test('missing required fields does not call the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    renderPage();

    await user.click(screen.getByRole('button', { name: /Send suggestion/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/Thanks/i)).not.toBeInTheDocument();
  });
});
