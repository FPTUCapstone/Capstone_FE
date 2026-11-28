import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { adminUserAccountsEn } from '../resources/en';
import { LockAccountDialog } from './LockAccountDialog';

const lockCopy = adminUserAccountsEn.moderation.lock;
const [cat1] = lockCopy.reasonCategories;
const other = lockCopy.otherCategory;

function renderDialog(overrides: Partial<Parameters<typeof LockAccountDialog>[0]> = {}) {
  const props = {
    open: true,
    titleId: 'lock-title',
    descriptionId: 'lock-description',
    account: { fullName: 'Nguyen Van A', email: 'a@mail.com', role: 'Traveler', statusLabel: 'Active' },
    category: '',
    note: '',
    busy: false,
    reasonError: false,
    serverError: '',
    onCategoryChange: vi.fn(),
    onNoteChange: vi.fn(),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<LockAccountDialog {...props} />);
  return props;
}

describe('LockAccountDialog', () => {
  it('renders nothing when closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the account summary, description and impact note', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Lock account' })).toBeTruthy();
    expect(within(dialog).getByText(adminUserAccountsEn.moderation.messages.MSG130)).toBeTruthy();
    expect(within(dialog).getByText('Nguyen Van A')).toBeTruthy();
    expect(within(dialog).getByText('a@mail.com')).toBeTruthy();
    expect(within(dialog).getByText('Traveler')).toBeTruthy();
    expect(within(dialog).getByText('Active')).toBeTruthy();
    expect(within(dialog).getByText(lockCopy.impactNote)).toBeTruthy();
  });

  it('shows a dash when the account has no email', () => {
    renderDialog({ account: { fullName: 'Nguyen Van A', email: null, role: 'Traveler', statusLabel: 'Active' } });
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows the status label verbatim', () => {
    renderDialog({
      account: { fullName: 'Nguyen Van A', email: 'a@mail.com', role: 'Operator', statusLabel: 'Pending contract signature' },
    });
    expect(screen.getByText('Pending contract signature')).toBeTruthy();
  });

  it('offers an empty option plus the four categories and reports changes', () => {
    const props = renderDialog();
    const select = screen.getByLabelText('Lock reason') as HTMLSelectElement;
    expect(select.options).toHaveLength(5);
    expect(select.options[0].value).toBe('');
    expect(select.options[0].textContent).toBe('Select a reason');
    fireEvent.change(select, { target: { value: cat1 } });
    expect(props.onCategoryChange).toHaveBeenCalledWith(cat1);

    fireEvent.change(screen.getByLabelText('Additional details'), { target: { value: 'details' } });
    expect(props.onNoteChange).toHaveBeenCalledWith('details');
  });

  it('shows MSG123 when the error flag is set and no category is chosen', () => {
    renderDialog({ category: '', reasonError: true });
    expect(screen.getByText('Please enter a reason.')).toBeTruthy();
  });

  it('hides MSG123 when the error flag is not set', () => {
    renderDialog({ category: '', reasonError: false });
    expect(screen.queryByText('Please enter a reason.')).toBeNull();
  });

  it('shows MSG123 for Other with a blank note', () => {
    renderDialog({ category: other, note: '   ', reasonError: true });
    expect(screen.getByText('Please enter a reason.')).toBeTruthy();
  });

  it('hides MSG123 once a category is chosen', () => {
    renderDialog({ category: cat1, reasonError: true });
    expect(screen.queryByText('Please enter a reason.')).toBeNull();
  });

  it('shows the too-long error and disables confirm when the composed reason exceeds 200', () => {
    renderDialog({ category: cat1, note: 'x'.repeat(190) });
    expect(screen.getByText('Reason must be at most 200 characters.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Confirm lock' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps confirm enabled when the form is empty', () => {
    renderDialog({ category: '' });
    expect((screen.getByRole('button', { name: 'Confirm lock' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the composed length counter', () => {
    renderDialog({ category: other, note: 'abc' });
    expect(screen.getByText('3/200')).toBeTruthy();
  });

  it('limits the note length so the composed reason stays within 200', () => {
    renderDialog({ category: cat1 });
    const note = screen.getByLabelText('Additional details') as HTMLTextAreaElement;
    expect(note.maxLength).toBe(200 - cat1.length - 2);
  });

  it('shows the server error inside the dialog as an alert', () => {
    renderDialog({ serverError: 'Denied 409' });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('alert').textContent).toBe('Denied 409');
  });

  it('calls onConfirm and onClose from the buttons', () => {
    const props = renderDialog({ category: cat1 });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm lock' }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close confirmation' }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('disables every control while busy', () => {
    renderDialog({ category: cat1, busy: true });
    expect((screen.getByRole('button', { name: 'Updating…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Close confirmation' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Lock reason') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Additional details') as HTMLTextAreaElement).disabled).toBe(true);
  });

  it('moves focus to the server error when it appears', () => {
    const props = {
      open: true,
      titleId: 'lock-title',
      descriptionId: 'lock-description',
      account: { fullName: 'Nguyen Van A', email: 'a@mail.com', role: 'Traveler', statusLabel: 'Active' },
      category: cat1,
      note: '',
      busy: false,
      reasonError: false,
      serverError: '',
      onCategoryChange: vi.fn(),
      onNoteChange: vi.fn(),
      onConfirm: vi.fn(),
      onClose: vi.fn(),
    };
    const view = render(<LockAccountDialog {...props} />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('alert')).toBeNull();
    view.rerender(<LockAccountDialog {...props} serverError="Denied 409" />);
    const alert = within(dialog).getByRole('alert');
    expect(alert.textContent).toBe('Denied 409');
    expect(document.activeElement).toBe(alert);
  });
});
