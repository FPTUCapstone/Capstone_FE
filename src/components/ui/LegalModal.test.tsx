import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { LegalModal } from './LegalModal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open terms</button>
      {open ? (
        <LegalModal title="Terms of Service" onClose={() => setOpen(false)}>
          Terms content
        </LegalModal>
      ) : null}
    </>
  );
}

describe('LegalModal keyboard accessibility', () => {
  it('moves focus into the dialog, traps Tab, closes on Escape, and restores focus', () => {
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Open terms' });
    trigger.focus();
    fireEvent.click(trigger);

    const close = screen.getByRole('button', { name: 'Close' });
    const acknowledge = screen.getByRole('button', { name: 'I understand' });
    expect(document.activeElement).toBe(close);

    close.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(acknowledge);

    acknowledge.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
