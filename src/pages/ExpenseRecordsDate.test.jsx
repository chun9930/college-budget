import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExpenseRecords from './ExpenseRecords';

function createExpense(index = 0) {
  return {
    id: `record-${index}`,
    amount: 1000,
    category: '식비',
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    date: `2026-04-30T09:00:00.000Z`,
  };
}

describe('ExpenseRecords date selection', () => {
  const baseProps = {
    expenseRecords: [createExpense()],
    recurringExpenses: [],
    onAddExpenseRecord: vi.fn(),
    onAddRecurringExpense: vi.fn(),
    onUpdateExpenseRecord: vi.fn(),
    onDeleteExpenseRecord: vi.fn(),
    onUpdateRecurringExpense: vi.fn(),
    onDeleteRecurringExpense: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T09:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the selected calendar date and saves expenses with that date', () => {
    const onAddExpenseRecord = vi.fn();

    render(
      <ExpenseRecords
        {...baseProps}
        selectedDateKey="2026-04-22"
        onAddExpenseRecord={onAddExpenseRecord}
      />
    );

    expect(screen.getByText(/2026년 4월 22일/)).toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText('금액')[0], { target: { value: '4200' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 저장' }));

    expect(onAddExpenseRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '4200',
        category: '식비',
        paymentMethod: '카드',
        date: '2026-04-22T00:00:00',
      })
    );
  });

  it('uses today when no selected date is provided', () => {
    const onAddExpenseRecord = vi.fn();

    render(<ExpenseRecords {...baseProps} onAddExpenseRecord={onAddExpenseRecord} />);

    fireEvent.change(screen.getAllByLabelText('금액')[0], { target: { value: '4200' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 저장' }));

    expect(onAddExpenseRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '4200',
        date: '2026-04-20T00:00:00',
      })
    );
  });
});
