const LABELS: Record<string, string> = {
  Scheduled: 'Đã lên lịch',
  Cancelled: 'Đã hủy',
  Completed: 'Đã hoàn thành',
  EmergencyStopped: 'Đã dừng khẩn cấp',
};

export function departureStatusLabel(status: string): string {
  return LABELS[status] ?? 'Không xác định';
}
