import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Calendar from './Calendar';

function renderCalendar(ui, initialEntries = ['/calendar']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('Calendar', () => {
  const expenseRecords = [
    {
      id: 'record-1',
      amount: 33000,
      category: '식비',
      paymentMethod: '카드',
      type: '일반',
      date: '2026-04-29T09:00:00.000Z',
      memo: '',
    },
    {
      id: 'record-2',
      amount: 22000,
      category: '교통',
      paymentMethod: '현금',
      type: '일반',
      date: '2026-04-29T12:00:00.000Z',
      memo: '점심',
    },
    {
      id: 'record-3',
      amount: 12000,
      category: '문화/여가',
      paymentMethod: '카드',
      type: '일반',
      date: '2026-04-28T18:00:00.000Z',
      memo: '',
    },
  ];

  it('shows monthly spending records first and keeps the calendar collapsed by default', () => {
    renderCalendar(<Calendar expenseRecords={expenseRecords} />);

    expect(screen.getByRole('heading', { name: '달력' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '달력 보기' })).toBeInTheDocument();
    expect(screen.getByText('이번달 지출')).toBeInTheDocument();
    expect(screen.getByText('4월 29일 수요일')).toBeInTheDocument();
    expect(screen.getByText('4월 28일 화요일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '접기' })).not.toBeInTheDocument();
  });

  it('toggles the calendar grid open and closed', () => {
    renderCalendar(<Calendar expenseRecords={expenseRecords} />);

    fireEvent.click(screen.getByRole('button', { name: '달력 보기' }));
    expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
    expect(screen.getByText('일')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '접기' }));
    expect(screen.getByRole('button', { name: '달력 보기' })).toBeInTheDocument();
  });

  it('opens the expense record callback when a monthly record row is clicked', () => {
    const onOpenExpenseRecord = vi.fn();
    renderCalendar(
      <Calendar expenseRecords={expenseRecords} onOpenExpenseRecord={onOpenExpenseRecord} />
    );

    const section = screen.getByText('4월 29일 수요일').closest('section');
    fireEvent.click(within(section).getByText('3.3만').closest('button'));

    expect(onOpenExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onOpenExpenseRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 'record-1' }));
  });

  it('notifies the parent when a calendar date is selected', () => {
    const onSelectDate = vi.fn();
    const { container } = renderCalendar(
      <Calendar expenseRecords={expenseRecords} onSelectDate={onSelectDate} />
    );

    fireEvent.click(screen.getByRole('button', { name: '달력 보기' }));

    const targetDay = Array.from(container.querySelectorAll('.calendar-day')).find(
      (button) => button.textContent?.includes('28')
    );

    fireEvent.click(targetDay);

    expect(onSelectDate).toHaveBeenCalledWith('2026-04-28');
  });
});
