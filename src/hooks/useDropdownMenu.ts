import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the panel lingers after the pointer leaves it, in milliseconds. */
const CLOSE_DELAY_MS = 120;

export interface DropdownMenu {
  /** Whether the panel is showing. */
  open: boolean;
  /** The element that wraps the trigger and the panel — the outside-click test. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The trigger button — focus returns here when Escape closes the menu. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Open the panel without marking it as opened by hover. */
  openMenu: () => void;
  /** The trigger's click handler: open a closed menu, close an open one. */
  toggle: () => void;
  /** Close the panel, optionally handing focus back to the trigger. */
  close: (returnFocus?: boolean) => void;
  /** The container's pointer-enter handler. */
  handlePointerEnter: () => void;
  /** The container's pointer-leave handler. */
  handlePointerLeave: () => void;
}

/**
 * The open/close behaviour of a hover-and-click dropdown.
 *
 * Why a hook: the top bar carries more than one dropdown, and each of them
 * needs the same six rules — open on hover, close on click, on Escape, on an
 * outside click and when the pointer leaves — with the same 120 ms grace
 * period that stops the menu flickering shut while the pointer travels down
 * to the panel. Written twice, the two copies would drift apart.
 *
 * Why a controlled state and not `<details>`: the browser owns a details
 * element's open state, so navigating from a link inside it leaves the panel
 * hanging open over the article. React owns the state here, so a click can
 * close the menu on the way out.
 */
export function useDropdownMenu(): DropdownMenu {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Why: the menu opens on hover, so a click usually lands on a panel that is
  // already showing. Swallowing that first click — and letting the next one
  // close the menu — stops the hover and the click from fighting.
  const openedByHover = useRef(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const close = useCallback(
    (returnFocus = false) => {
      clearCloseTimer();
      openedByHover.current = false;
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [clearCloseTimer],
  );

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const toggle = useCallback(() => {
    if (!open) {
      openMenu();
      return;
    }
    if (openedByHover.current) {
      openedByHover.current = false;
      return;
    }
    close();
  }, [open, openMenu, close]);

  const handlePointerEnter = useCallback(() => {
    clearCloseTimer();
    openedByHover.current = true;
    setOpen(true);
  }, [clearCloseTimer]);

  const handlePointerLeave = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      openedByHover.current = false;
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  // Escape closes and hands focus back to the trigger; a click outside the
  // trigger and the panel closes without moving focus.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && containerRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  return {
    open,
    containerRef,
    triggerRef,
    openMenu,
    toggle,
    close,
    handlePointerEnter,
    handlePointerLeave,
  };
}
