/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TopNav from '@/components/layout/TopNav';
import { GUIDES } from '@/content/guides';

function renderNav() {
  // The nav sits outside the outlet so it stays mounted across a navigation —
  // exactly as it does in the real route tree, where `Layout` wraps every
  // page and the panel state has to survive the click that navigates.
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          element={
            <>
              <TopNav />
              <Outlet />
            </>
          }
        >
          <Route path="/" element={<div>home</div>} />
          <Route path="/guides" element={<div>guides hub</div>} />
          <Route path="/guides/:slug" element={<div>guide article</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const trigger = () => screen.getByRole('button', { name: /^guides$/i });

// The row's accessible name ends with the read time ("… 5 min"), so the rows
// are found by their `title` attribute — the full, untruncated title.
const guideRow = (title: string) => screen.getByTitle(title).closest('a') as HTMLAnchorElement;

describe('TopNav guides menu', () => {
  test('the trigger is a button that reports its collapsed state', () => {
    renderNav();

    const button = trigger();
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'All guides →' })).not.toBeInTheDocument();
  });

  test('hovering the trigger opens the panel with every guide in it', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.hover(trigger());

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('link', { name: 'All guides →' }).closest('div');
    expect(panel).not.toBeNull();
    for (const guide of GUIDES) {
      expect(within(panel as HTMLElement).getByTitle(guide.title)).toBeInTheDocument();
    }
  });

  test('the panel stays open while the pointer travels into it', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.hover(trigger());
    await user.hover(guideRow(GUIDES[0].title));

    // Longer than the close delay — a menu that closed on the way down would
    // already be gone by now.
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByRole('link', { name: 'All guides →' })).toBeInTheDocument();
  });

  test('clicking a guide navigates and closes the panel', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.hover(trigger());
    await user.click(guideRow(GUIDES[0].title));

    expect(screen.getByText('guide article')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'All guides →' })).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes the panel and hands focus back to the trigger', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.hover(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('link', { name: 'All guides →' })).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  test('a click outside the panel closes it', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.hover(trigger());
    await user.click(document.body);

    expect(screen.queryByRole('link', { name: 'All guides →' })).not.toBeInTheDocument();
  });

  test('the pointer leaving the trigger and the panel closes it', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.hover(trigger());
    await user.unhover(trigger());

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'All guides →' })).not.toBeInTheDocument(),
    );
  });

  test('the trigger opens the menu from the keyboard too', async () => {
    const user = userEvent.setup();
    renderNav();

    trigger().focus();
    await user.keyboard('{Enter}');

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'All guides →' })).toBeInTheDocument();
  });
});
