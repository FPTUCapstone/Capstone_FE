import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import { CreatePollModal } from '../components/CreatePollModal';
import { BroadcastModal } from '../components/BroadcastModal';
afterEach(cleanup);
const expense = { title: 'Dinner', totalAmount: 1001, perPersonAmount: 333, payerName: 'Host', payerBankName: 'ACB', payerBankAccount: '00123456', participantNames: [], paidUserIds: [42] };
it('blocks letter typing and alphabetic pastes in money and account inputs without silently changing the amount', () => {
  render(<CreateExpenseModal currentUserName="Host" memberCount={3} onClose={vi.fn()} onSubmit={vi.fn()} />);
  const amount = screen.getByRole('textbox', { name: 'Tổng số tiền (VND)' }) as HTMLInputElement;
  expect(amount.inputMode).toBe('numeric');
  fireEvent.change(amount, { target: { value: '1000' } });
  expect(fireEvent.keyDown(amount, { key: 'e' })).toBe(false);
  expect(fireEvent.keyDown(amount, { key: 'v', ctrlKey: true })).toBe(true);
  fireEvent.change(amount, { target: { value: '1e3' } }); expect(amount.value).toBe('1000');
  fireEvent.change(amount, { target: { value: '600.000' } }); expect(amount.value).toBe('600.000');
  const account = screen.getByRole('textbox', { name: 'Số tài khoản' }) as HTMLInputElement;
  fireEvent.change(account, { target: { value: '00123456' } });
  fireEvent.change(account, { target: { value: '0012AB' } }); expect(account.value).toBe('00123456');
});
it.each(['0', '1.50', '1.000,000', '9007199254740992'])('rejects invalid or unsafe VND amounts: %s', async value => {
  const submit = vi.fn(); render(<CreateExpenseModal initialData={expense} currentUserName="Host" memberCount={3} onClose={vi.fn()} onSubmit={submit} />);
  fireEvent.change(screen.getByLabelText('Tổng số tiền (VND)'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi chia tiền' }));
  expect((await screen.findByRole('alert')).textContent).toContain('VND nguyên dương'); expect(submit).not.toHaveBeenCalled();
});
it('edits an expense with custom labels, recomputes the split and keeps the form on failure', async () => {
  const submit = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true); const close = vi.fn();
  render(<CreateExpenseModal initialData={expense} title="Sửa khoản chi" submitLabel="Lưu khoản chi" currentUserName="Other" memberCount={3} onClose={close} onSubmit={submit} />);
  expect(screen.getByRole('dialog', { name: 'Sửa khoản chi' })).toBeTruthy();
  expect((screen.getByLabelText('Số tài khoản') as HTMLInputElement).value).toBe('00123456');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu khoản chi' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dinner', totalAmount: 1001, perPersonAmount: 333, payerBankName: 'ACB' })));
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Lưu khoản chi' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
});
it('prefills a poll for editing and submits changed text through the existing callback', async () => {
  const submit = vi.fn().mockResolvedValue(true);
  render(<CreatePollModal title="Sửa bình chọn" submitLabel="Lưu bình chọn" initialData={{ question: 'Lunch?', options: [{ id: '0', text: 'Rice', voterUserIds: [] }, { id: '1', text: 'Noodles', voterUserIds: [] }], totalVotes: 0 }} onClose={vi.fn()} onSubmit={submit} />);
  expect(screen.getByRole('dialog', { name: 'Sửa bình chọn' })).toBeTruthy();
  expect((screen.getByLabelText('Lựa chọn 2') as HTMLInputElement).value).toBe('Noodles');
  fireEvent.change(screen.getByLabelText('Câu hỏi bình chọn'), { target: { value: 'Dinner?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bình chọn' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ question: 'Dinner?' })));
});
it('prefills broadcast priority and content and prevents changes while saving', async () => {
  let resolve!: (saved: boolean) => void; const close = vi.fn();
  const submit = vi.fn(() => new Promise<boolean>(yes => { resolve = yes; }));
  render(<BroadcastModal title="Sửa thông báo" submitLabel="Lưu thông báo" initialData={{ title: 'Meet', content: 'At noon', priority: 'normal', acknowledgedUserIds: [] }} onClose={close} onSubmit={submit} />);
  expect(screen.getByRole('dialog', { name: 'Sửa thông báo' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Tiêu chuẩn/ }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thông báo' }));
  expect((screen.getByRole('button', { name: /Khẩn cấp/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Meet', content: 'At noon', priority: 'normal' }));
  resolve(true); await waitFor(() => expect(close).toHaveBeenCalledOnce());
});
it.each([
  { question: 'Lunch?', texts: [' Rice ', 'rice'] },
  { question: 'q'.repeat(201), texts: ['A', 'B'] },
  { question: 'Lunch?', texts: ['a'.repeat(201), 'B'] },
  { question: 'Lunch?', texts: Array.from({ length: 7 }, (_, i) => `Option ${i}`) },
])('rejects invalid poll metadata in edit prefills', async ({ question, texts }) => {
  const submit = vi.fn();
  render(<CreatePollModal initialData={{ question, options: texts.map((text, i) => ({ id: String(i), text, voterUserIds: [] })), totalVotes: 0 }} onSubmit={submit} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bình chọn' }));
  expect(await screen.findByRole('alert')).toBeTruthy(); expect(submit).not.toHaveBeenCalled();
});
it.each([{ title: 't'.repeat(201), content: 'Valid' }, { title: 'Valid', content: 'c'.repeat(4001) }])('rejects oversize broadcast metadata on edit', async values => {
  const submit = vi.fn(); render(<BroadcastModal initialData={{ ...values, priority: 'normal', acknowledgedUserIds: [] }} onClose={vi.fn()} onSubmit={submit} />);
  fireEvent.click(screen.getByRole('button', { name: 'Phát thông báo' }));
  expect(await screen.findByRole('alert')).toBeTruthy(); expect(submit).not.toHaveBeenCalled();
});
it('rejects an overlong expense recipient from edit data', async () => {
  const submit = vi.fn(); render(<CreateExpenseModal initialData={{ ...expense, payerName: 'a'.repeat(121) }} currentUserName="Host" memberCount={3} onClose={vi.fn()} onSubmit={submit} />);
  fireEvent.click(screen.getByRole('button', { name: 'Gửi chia tiền' }));
  expect(await screen.findByRole('alert')).toBeTruthy(); expect(submit).not.toHaveBeenCalled();
});
it('locks a voted poll and permits only appending options while preserving its recorded votes', async () => {
  const initialData = { question: 'Lunch?', options: [{ id: '0', text: 'Rice', voterUserIds: [42] }, { id: '1', text: 'Noodles', voterUserIds: [] }], totalVotes: 1 };
  const submit = vi.fn().mockResolvedValue(true);
  render(<CreatePollModal initialData={initialData} onClose={vi.fn()} onSubmit={submit} />);
  expect((screen.getByLabelText('Câu hỏi bình chọn') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText('Lựa chọn 1') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText('Lựa chọn 2') as HTMLInputElement).disabled).toBe(true);
  expect(screen.getByText(/Đã có phiếu bầu/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Thêm lựa chọn khác/ }));
  expect((screen.getByRole('button', { name: 'Xóa lựa chọn 1' }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button', { name: 'Xóa lựa chọn 3' }) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.change(screen.getByLabelText('Lựa chọn 3'), { target: { value: 'Soup' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bình chọn' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ ...initialData, options: [...initialData.options, { id: '2', text: 'Soup', voterUserIds: [] }] }));
});
it('uses the confirmed poll field limits and leaves unvoted poll fields editable', () => {
  render(<CreatePollModal onClose={vi.fn()} onSubmit={vi.fn()} />);
  const question = screen.getByLabelText('Câu hỏi bình chọn') as HTMLInputElement;
  const option = screen.getByLabelText('Lựa chọn 1') as HTMLInputElement;
  expect(question.maxLength).toBe(200); expect(option.maxLength).toBe(200);
  expect(question.disabled).toBe(false); expect(option.disabled).toBe(false);
});
it.each([150, 200])('allows editing a voted poll with an existing %s-character option', async length => {
  const initialData = { question: 'Lunch?', options: [{ id: '0', text: 'A'.repeat(length), voterUserIds: [42] }, { id: '1', text: 'Noodles', voterUserIds: [] }], totalVotes: 1 };
  const submit = vi.fn().mockResolvedValue(true);
  render(<CreatePollModal initialData={initialData} onClose={vi.fn()} onSubmit={submit} />);
  fireEvent.click(screen.getByRole('button', { name: /Thêm lựa chọn khác/ }));
  fireEvent.change(screen.getByLabelText('Lựa chọn 3'), { target: { value: 'Soup' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bình chọn' }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ ...initialData, options: [...initialData.options, { id: '2', text: 'Soup', voterUserIds: [] }] }));
});
