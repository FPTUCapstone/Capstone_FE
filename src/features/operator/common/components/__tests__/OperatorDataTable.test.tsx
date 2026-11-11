import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OperatorDataTable, type TableColumn } from '../OperatorDataTable';

interface SampleItem {
  id: string;
  name: string;
  status: string;
}

const COLUMNS: TableColumn<SampleItem>[] = [
  { key: 'id', title: 'Mã số', render: (item) => <span>{item.id}</span> },
  { key: 'name', title: 'Tên tour', render: (item) => <span>{item.name}</span> },
  { key: 'status', title: 'Trạng thái', render: (item) => <span>{item.status}</span> },
];

const SAMPLE_DATA: SampleItem[] = [
  { id: 'TP-01', name: 'Bà Nà Hills', status: 'Đã duyệt' },
  { id: 'TP-02', name: 'Phố Cổ Hội An', status: 'Chờ duyệt' },
];

describe('OperatorDataTable', () => {
  it('renders table headers and data rows correctly', () => {
    render(<OperatorDataTable columns={COLUMNS} data={SAMPLE_DATA} keyExtractor={(item) => item.id} />);

    expect(screen.getByText('Mã số')).toBeDefined();
    expect(screen.getByText('Tên tour')).toBeDefined();
    expect(screen.getByText('Trạng thái')).toBeDefined();

    expect(screen.getByText('TP-01')).toBeDefined();
    expect(screen.getByText('Bà Nà Hills')).toBeDefined();
    expect(screen.getByText('TP-02')).toBeDefined();
    expect(screen.getByText('Phố Cổ Hội An')).toBeDefined();
  });

  it('renders loading skeleton rows when loading is true', () => {
    render(<OperatorDataTable columns={COLUMNS} data={[]} loading={true} keyExtractor={(item) => item.id} />);

    const skeletons = screen.getAllByTestId('table-skeleton-row');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty message when data is empty and not loading', () => {
    render(
      <OperatorDataTable
        columns={COLUMNS}
        data={[]}
        loading={false}
        emptyMessage="Không tìm thấy bản ghi nào phù hợp."
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText('Không tìm thấy bản ghi nào phù hợp.')).toBeDefined();
  });
});
