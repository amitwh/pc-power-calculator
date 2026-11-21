/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Feedback from '@/pages/Feedback';

function renderPage() {
  return render(
    <MemoryRouter>
      <Feedback />
    </MemoryRouter>,
  );
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/feedback form', () => {
  test('renders the type, subject, message, email and honeypot fields', () => {
    const { container } = renderPage();

    expect(screen.getByRole('heading', { name: /Send feedback/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Type$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Message$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your email/i)).toBeInTheDocument();
    expect(screen.getByText(/sent directly to ConcreteInfo/i)).toBeInTheDocument();

    const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();

    const type = screen.getByLabelText(/^Type$/i) as HTMLSelectElement;
    expect(Array.from(type.options).map((option) => option.value)).toEqual([
      'bug',
      'idea',
      'content',
      'general',
    ]);
  });

  test('a valid submit posts kind feedback and reports success', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, { ok: true }));

    renderPage();

    await user.selectOptions(screen.getByLabelText(/^Type$/i), 'idea');
    await user.type(screen.getByLabelText(/^Subject$/i), 'Add a dark-mode chart');
    await user.type(
      screen.getByLabelText(/^Message$/i),
      'The power chart is hard to read in dark mode on an OLED screen.',
    );
    await user.type(screen.getByLabelText(/Your email/i), 'person@example.com');
    await user.click(screen.getByRole('button', { name: /Send feedback/i }));

    expect(await screen.findByText('Thanks — your feedback was sent.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/messages');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');

    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(payload).toMatchObject({
      kind: 'feedback',
      type: 'idea',
      subject: 'Add a dark-mode chart',
      message: 'The power chart is hard to read in dark mode on an OLED screen.',
      email: 'person@example.com',
      website: '',
    });
  });

  test('required fields are enforced before the API is called', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    renderPage();

    await user.type(screen.getByLabelText(/^Subject$/i), 'Hi');
    await user.click(screen.getByRole('button', { name: /Send feedback/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/Thanks/i)).not.toBeInTheDocument();
  });

  test('an API error shows its message and never claims success', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(500, {
        error: 'INTERNAL_ERROR',
        message: 'Your message could not be sent. Please try again later.',
        detail: {},
      }),
    );

    renderPage();

    await user.type(screen.getByLabelText(/^Subject$/i), 'Broken chart');
    await user.type(
      screen.getByLabelText(/^Message$/i),
      'The chart disappears when I switch tabs and come back.',
    );
    await user.click(screen.getByRole('button', { name: /Send feedback/i }));

    expect(
      await screen.findByText('Your message could not be sent. Please try again later.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/feedback was sent/i)).not.toBeInTheDocument();
  });
});
