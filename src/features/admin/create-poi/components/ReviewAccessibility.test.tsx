import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEmptyPoiForm } from '../services/poi-contract';
import { DANANG_COORDINATE_PRESETS } from '../mock/defaultPoiData';
import { MapPickerMock } from './MapPickerMock';
import { OpeningHoursSection } from './OpeningHoursSection';
import { VisitAttributesSection } from './VisitAttributesSection';

describe('Create POI reviewed controls', () => {
  it('names the shelter checkbox and lets its visible text toggle the value', () => {
    const onChange = vi.fn();
    render(<VisitAttributesSection formData={createEmptyPoiForm()} errors={{}} onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Shelter available on site' });
    fireEvent.click(screen.getByText('Shelter available on site'));
    expect(checkbox).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith('has_shelter', true);
  });

  it('connects a day-level schedule error to both time inputs', () => {
    const formData = createEmptyPoiForm();
    formData.operating_schedule = [{ day_name: 'Monday', day_of_week: 1, is_open: true, open_time: '18:00', close_time: '09:00' }];
    const message = 'Monday: opening time must be earlier than closing time on the same day.';
    render(<OpeningHoursSection formData={formData} errors={{ 'operating_schedule.1': message }} onChange={vi.fn()} />);

    const opening = screen.getByLabelText('Monday opening time');
    const closing = screen.getByLabelText('Monday closing time');
    const errorId = opening.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(closing.getAttribute('aria-describedby')).toBe(errorId);
    expect(document.getElementById(errorId ?? '')?.textContent).toBe(message);
  });

  it('only exposes the working coordinate presets as map buttons', () => {
    const onSelectCoordinates = vi.fn();
    render(<MapPickerMock latitude="" longitude="" onSelectCoordinates={onSelectCoordinates} />);

    expect(screen.getAllByRole('button')).toHaveLength(DANANG_COORDINATE_PRESETS.length);
    fireEvent.click(screen.getByRole('button', { name: 'Dragon Bridge' }));
    expect(onSelectCoordinates).toHaveBeenCalledWith(16.061099, 108.227282, 'An Hai Tay, Son Tra, Da Nang');
  });
});
