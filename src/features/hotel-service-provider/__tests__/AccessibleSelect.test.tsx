import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AccessibleSelect } from '../components/common/AccessibleSelect';

describe('AccessibleSelect Component (WCAG 2.2 AA / ARIA 1.2 Combobox)', () => {
  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3', disabled: true },
  ];

  it('renders with proper ARIA combobox attributes and closed state', () => {
    render(
      <AccessibleSelect
        label="Test Select"
        options={options}
        value="opt1"
        onChange={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox', { name: /Test Select/i });
    expect(combobox).toBeDefined();
    expect(combobox.getAttribute('aria-expanded')).toBe('false');
    expect(combobox.getAttribute('aria-haspopup')).toBe('listbox');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens listbox on click and updates aria-expanded to true', () => {
    render(
      <AccessibleSelect
        label="Test Select"
        options={options}
        value="opt1"
        onChange={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    expect(combobox.getAttribute('aria-expanded')).toBe('true');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeDefined();

    const renderedOptions = screen.getAllByRole('option');
    expect(renderedOptions.length).toBe(3);
    expect(renderedOptions[0].getAttribute('aria-selected')).toBe('true');
    expect(renderedOptions[1].getAttribute('aria-selected')).toBe('false');
  });

  it('calls onChange and closes when an enabled option is clicked', () => {
    const handleChange = vi.fn();
    render(
      <AccessibleSelect
        label="Test Select"
        options={options}
        value="opt1"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    const option2 = screen.getByText('Option 2');
    fireEvent.click(option2);

    expect(handleChange).toHaveBeenCalledWith('opt2');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does not select disabled options', () => {
    const handleChange = vi.fn();
    render(
      <AccessibleSelect
        label="Test Select"
        options={options}
        value="opt1"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    const disabledOption = screen.getByText('Option 3');
    fireEvent.click(disabledOption);

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('supports keyboard navigation: ArrowDown, Enter, Escape', () => {
    const handleChange = vi.fn();
    render(
      <AccessibleSelect
        label="Test Select"
        options={options}
        value="opt1"
        onChange={handleChange}
      />
    );

    const combobox = screen.getByRole('combobox');
    combobox.focus();

    // ArrowDown opens menu
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeDefined();

    // ArrowDown navigates to option 2
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    // Enter selects option 2
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('opt2');
    expect(screen.queryByRole('listbox')).toBeNull();

    // Reopen and close with Escape
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeDefined();
    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
