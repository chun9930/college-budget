import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import Calendar from './Calendar';

describe('Calendar', () => {
  const expenseRecords = [
    {
      id: '1',
      amount: 8000,
      category: '식비',
      paymentMethod: '체크카드',
      type: '일반',
      date: '2026-04-28T09:00:00.000Z',
      memo: '',
    },
    {
      id: '2',
      amount: 5000,
      category: '카페',
      paymentMethod: '현금',
      type: '일반',
      date: '2026-04-28T12:00:00.000Z',
      memo: '점심 후',
    },
    {
      id: '3',
      amount: 12000,
      category: '교통',
      paymentMethod: '교통카드',
      type: '일반',
      date: '2026-04-27T18:00:00.000Z',
      memo: '',
    },
  ];

  it('keeps the calendar collapsed by default and shows the monthly list first', () => {
    render(<Calendar expenseRecords={expenseRecords} />);

    expect(screen.getByRole('heading', { name: '캘린더' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '달력 보기' })).toBeInTheDocument();
    expect(screen.getByText('4월 28일 월요일')).toBeInTheDocument();
    expect(screen.getByText('4월 27일 일요일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '일' })).not.toBeInTheDocument();
  });

  it('toggles the calendar grid open and closed', () => {
    render(<Calendar expenseRecords={expenseRecords} />);

    fireEvent.click(screen.getByRole('button', { name: '달력 보기' }));
    expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일' })).toBeInTheDocument();
    expect(screen.getByText('1.3만')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '접기' }));
    expect(screen.getByRole('button', { name: '달력 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '일' })).not.toBeInTheDocument();
  });

  it('highlights the selected date section when a calendar date is clicked', () => {
    const { container } = render(<Calendar expenseRecords={expenseRecords} />);

    fireEvent.click(screen.getByRole('button', { name: '달력 보기' }));

    const selectedCalendarDay = Array.from(container.querySelectorAll('.calendar-day')).find((button) =>
      button.textContent?.includes('27')
    );

    expect(selectedCalendarDay).toBeTruthy();

    fireEvent.click(selectedCalendarDay);

    const selectedSection = container.querySelector('.calendar-day-section.is-selected');
    expect(selectedSection).toHaveTextContent('4월 27일 일요일');
    expect(selectedSection).toHaveTextContent('1.2만');
  });

  it('notifies the parent when a calendar date is selected', () => {
    const onSelectDate = vi.fn();
    const { container } = render(
      <Calendar expenseRecords={expenseRecords} onSelectDate={onSelectDate} />
    );

    fireEvent.click(screen.getByRole('button', { name: '달력 보기' }));

    const targetDay = Array.from(container.querySelectorAll('.calendar-day')).find((button) =>
      button.textContent?.includes('28')
    );

    fireEvent.click(targetDay);

    expect(onSelectDate).toHaveBeenCalledWith('2026-04-28');
  });
});
