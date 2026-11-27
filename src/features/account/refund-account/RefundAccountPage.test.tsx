import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const session = vi.hoisted(() => ({ userId: 42 }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => ({ status: 'authenticated', context: { role: 'Traveler', userId: session.userId } }) }));
import { RefundAccountPage } from './RefundAccountPage';
const saved = { bankCode: 'VCB', accountNumber: '1234567890', accountHolder: 'NGUYEN VAN A' };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); session.userId = 42; });

it('ignores an old save response after another traveler signs in', async () => {
  let finishSave!: (response: Response) => void;
  const pending = new Promise<Response>(resolve => { finishSave = resolve; });
  const other = { bankCode: 'TCB', accountNumber: '88888888', accountHolder: 'OTHER TRAVELER' };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json(saved)).mockReturnValueOnce(pending).mockResolvedValueOnce(Response.json(other)));
  const view = render(<RefundAccountPage />);
  await screen.findByDisplayValue(saved.accountNumber);
  fireEvent.click(screen.getByRole('button', { name: 'Lưu tài khoản' }));
  session.userId = 99;
  view.rerender(<RefundAccountPage />);
  await screen.findByDisplayValue(other.accountNumber);
  await act(async () => { finishSave(Response.json(saved)); await pending; });
  expect(screen.getByDisplayValue(other.accountNumber)).toBeTruthy();
  expect(screen.queryByDisplayValue(saved.accountNumber)).toBeNull();
});

it('loads the saved account without requesting it again from the traveler', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(saved)));
  render(<RefundAccountPage />);
  await screen.findByDisplayValue('1234567890');
  expect(screen.getByDisplayValue('NGUYEN VAN A')).toBeTruthy();
});

it('saves only the recipient fields and shows a saved confirmation', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(null)).mockResolvedValueOnce(Response.json(saved));
  vi.stubGlobal('fetch', fetchMock);
  render(<RefundAccountPage />);
  await screen.findByText('Bạn chưa lưu tài khoản nhận hoàn tiền.');
  fireEvent.change(screen.getByLabelText('Ngân hàng / mã ngân hàng'), { target: { value: 'VCB' } });
  fireEvent.change(screen.getByLabelText('Số tài khoản'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByLabelText('Tên chủ tài khoản'), { target: { value: 'NGUYEN VAN A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu tài khoản' }));
  await screen.findByText('Đã lưu tài khoản nhận hoàn tiền.');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(saved);
  expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
});

it('offers retry and prevents saving when the existing account failed to load', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(Response.json(saved)));
  render(<RefundAccountPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
  await waitFor(() => expect(screen.getByDisplayValue('1234567890')).toBeTruthy());
});
