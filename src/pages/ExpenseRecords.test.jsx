import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ExpenseRecords from './ExpenseRecords';
import { GENERAL_EXPENSE_CATEGORIES, RECURRING_EXPENSE_CATEGORIES } from '../lib/categories';

function renderExpenseRecords(ui, initialEntries = ['/expense-records']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function openRecurringPage() {
  fireEvent.click(screen.getByRole('tab', { name: '정기지출 관리' }));
  return screen.getByRole('heading', { name: '정기지출 관리' }).closest('section');
}

function createRecord(index, overrides = {}) {
  return {
    id: `record-${index}`,
    amount: 1000 * (index + 1),
    category: index === 0 ? GENERAL_EXPENSE_CATEGORIES[0] : index % 2 === 0 ? '교통' : '쇼핑',
    paymentMethod: index === 0 ? '카드' : index % 2 === 0 ? '현금' : '이체',
    type: '일반',
    memo: '',
    date: `2026-04-${String(30 - index).padStart(2, '0')}T09:00:00.000Z`,
    ...overrides,
  };
}

describe('ExpenseRecords', () => {
  const baseProps = {
    expenseRecords: Array.from({ length: 10 }, (_, index) => createRecord(index)),
    recurringExpenses: [
      {
        id: 'recurring-1',
        name: '넷플릭스',
        amount: '17000',
        category: RECURRING_EXPENSE_CATEGORIES[3],
        paymentDay: '5',
        paymentMethod: '카드',
        memo: '가족 공유 요금',
      },
    ],
    onAddExpenseRecord: vi.fn(),
    onAddRecurringExpense: vi.fn(),
    onUpdateExpenseRecord: vi.fn(),
    onDeleteExpenseRecord: vi.fn(),
    onUpdateRecurringExpense: vi.fn(),
    onDeleteRecurringExpense: vi.fn(),
    showToast: vi.fn(),
    dailyBudget: 50000,
    todaySpent: 12000,
    selectedDateKey: '2026-04-28',
  };

  it('shows 10 recent records in quick input', () => {
    renderExpenseRecords(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' }).closest('section');
    expect(section).toBeInTheDocument();
    expect(within(section).getAllByRole('button')).toHaveLength(10);
  });

  it('switches between the general expense and recurring expense internal pages', () => {
    renderExpenseRecords(<ExpenseRecords {...baseProps} />);

    expect(screen.getByRole('tab', { name: '일반 지출 기록' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: '일반 지출 기록' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '지출 기록' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '일반 지출 기록 목록' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '정기지출 관리' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '정기지출 관리' }));

    expect(screen.getByRole('tab', { name: '정기지출 관리' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: '정기지출 관리' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '일반 지출 기록' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '일반 지출 기록' }));

    expect(screen.getByRole('heading', { name: '일반 지출 기록' })).toBeInTheDocument();
  });

  it('fills the form when a recent record is clicked', () => {
    renderExpenseRecords(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button')[0]);

    expect(screen.getByLabelText('금액')).toHaveValue('1000');

    const categoryGroup = screen.getByRole('group', { name: '일반 지출 카테고리' });
    const methodGroup = screen.getByRole('group', { name: '일반 지출 결제수단' });

    expect(within(categoryGroup).getByRole('button', { name: GENERAL_EXPENSE_CATEGORIES[0] })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(methodGroup).getByRole('button', { name: '카드' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('validates the general expense amount field in real time', () => {
    const onAddExpenseRecord = vi.fn();

    renderExpenseRecords(<ExpenseRecords {...baseProps} onAddExpenseRecord={onAddExpenseRecord} />);

    const amountInput = screen.getByLabelText('금액');
    const saveButton = screen.getByRole('button', { name: '지출 저장' });

    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '0' } });
    expect(screen.getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '-1000' } });
    expect(screen.getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: 'abc' } });
    expect(screen.getByText('숫자만 입력할 수 있어요')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '4200' } });
    expect(screen.queryByText('금액을 입력해주세요')).not.toBeInTheDocument();
    expect(screen.queryByText('0보다 큰 금액을 입력해주세요')).not.toBeInTheDocument();
    expect(screen.queryByText('숫자만 입력할 수 있어요')).not.toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(onAddExpenseRecord).toHaveBeenCalledTimes(1);
  });

  it('validates the recurring expense amount field in real time', () => {
    const onAddRecurringExpense = vi.fn();

    renderExpenseRecords(
      <ExpenseRecords {...baseProps} onAddRecurringExpense={onAddRecurringExpense} />
    );

    const recurringSection = openRecurringPage();
    const amountInput = within(recurringSection).getByLabelText('금액');
    const saveButton = within(recurringSection).getByRole('button', { name: '정기지출 저장' });

    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '0' } });
    expect(screen.getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '-1000' } });
    expect(screen.getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: 'abc' } });
    expect(screen.getByText('숫자만 입력할 수 있어요')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '17000' } });
    expect(screen.queryByText('금액을 입력해주세요')).not.toBeInTheDocument();
    expect(screen.queryByText('0보다 큰 금액을 입력해주세요')).not.toBeInTheDocument();
    expect(screen.queryByText('숫자만 입력할 수 있어요')).not.toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(onAddRecurringExpense).toHaveBeenCalledTimes(1);
  });

  it('keeps general expense saving working', () => {
    const onAddExpenseRecord = vi.fn();
    const showToast = vi.fn();

    renderExpenseRecords(
      <ExpenseRecords {...baseProps} onAddExpenseRecord={onAddExpenseRecord} showToast={showToast} />
    );

    fireEvent.change(screen.getByLabelText('금액'), { target: { value: '4200' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 저장' }));

    expect(onAddExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onAddExpenseRecord.mock.calls[0][0]).toMatchObject({
      amount: '4200',
      category: GENERAL_EXPENSE_CATEGORIES[0],
      paymentMethod: '카드',
      type: '일반',
      date: '2026-04-28T00:00:00',
    });
    expect(showToast).toHaveBeenCalledWith('일반 지출이 저장되었습니다');
  });

  it('shows the general expense edit form and updates an existing record', () => {
    const onUpdateExpenseRecord = vi.fn();
    const showToast = vi.fn();

    renderExpenseRecords(
      <ExpenseRecords
        {...baseProps}
        onUpdateExpenseRecord={onUpdateExpenseRecord}
        showToast={showToast}
      />
    );

    const generalSection = screen.getByRole('heading', { name: '일반 지출 기록 목록' }).closest('section');
    fireEvent.click(within(generalSection).getAllByRole('button', { name: '수정' })[0]);

    expect(screen.getByText('지출 기록 수정 중')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지출 수정 저장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정 취소' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('금액'), { target: { value: '2500' } });
    fireEvent.change(screen.getByLabelText('메모'), { target: { value: '수정 메모' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 수정 저장' }));

    expect(onUpdateExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onUpdateExpenseRecord).toHaveBeenCalledWith('record-0', {
      amount: '2500',
      category: GENERAL_EXPENSE_CATEGORIES[0],
      paymentMethod: '카드',
      type: '일반',
      memo: '수정 메모',
    });
    expect(showToast).toHaveBeenCalledWith('일반 지출이 수정되었습니다');
  });

  it('shows recurring default date today and restores it after canceling edit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 9, 0, 0));

    try {
      renderExpenseRecords(<ExpenseRecords {...baseProps} />);

      const recurringSection = openRecurringPage();
      expect(screen.getByLabelText('결제일')).toHaveValue('2026-04-29');

      fireEvent.click(within(recurringSection).getAllByRole('button', { name: '수정' })[0]);
      expect(screen.getByLabelText('결제일')).toHaveValue('2026-04-05');

      fireEvent.click(screen.getByRole('button', { name: '수정 취소' }));
      expect(screen.getByLabelText('결제일')).toHaveValue('2026-04-29');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows recurring edit and delete controls', () => {
    renderExpenseRecords(<ExpenseRecords {...baseProps} />);

    const recurringSection = openRecurringPage();
    expect(within(recurringSection).getAllByRole('button', { name: '수정' })).toHaveLength(1);
    expect(within(recurringSection).getAllByRole('button', { name: '삭제' })).toHaveLength(1);
  });

  it('shows a toast after deleting a general expense', () => {
    const onDeleteExpenseRecord = vi.fn();
    const showToast = vi.fn();

    renderExpenseRecords(
      <ExpenseRecords
        {...baseProps}
        onDeleteExpenseRecord={onDeleteExpenseRecord}
        showToast={showToast}
      />
    );

    const generalSection = screen.getByRole('heading', { name: '일반 지출 기록 목록' }).closest('section');
    fireEvent.click(within(generalSection).getAllByRole('button', { name: '삭제' })[0]);

    expect(onDeleteExpenseRecord).toHaveBeenCalledWith('record-0');
    expect(showToast).toHaveBeenCalledWith('일반 지출이 삭제되었습니다');
  });

  it('shows a toast after saving a recurring expense', () => {
    const onAddRecurringExpense = vi.fn();
    const showToast = vi.fn();

    renderExpenseRecords(
      <ExpenseRecords
        {...baseProps}
        onAddRecurringExpense={onAddRecurringExpense}
        showToast={showToast}
      />
    );

    const recurringSection = openRecurringPage();
    fireEvent.change(within(recurringSection).getByLabelText('항목명'), {
      target: { value: '넷플릭스' },
    });
    fireEvent.change(within(recurringSection).getByLabelText('금액'), {
      target: { value: '17000' },
    });
    fireEvent.click(within(recurringSection).getByRole('button', { name: '정기지출 저장' }));

    expect(onAddRecurringExpense).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('정기지출이 저장되었습니다');
  });

  it('shows a toast after deleting a recurring expense', () => {
    const onDeleteRecurringExpense = vi.fn();
    const showToast = vi.fn();

    renderExpenseRecords(
      <ExpenseRecords
        {...baseProps}
        onDeleteRecurringExpense={onDeleteRecurringExpense}
        showToast={showToast}
      />
    );

    const recurringSection = openRecurringPage();
    fireEvent.click(within(recurringSection).getAllByRole('button', { name: '삭제' })[0]);

    expect(onDeleteRecurringExpense).toHaveBeenCalledWith('recurring-1');
    expect(showToast).toHaveBeenCalledWith('정기지출이 삭제되었습니다');
  });
});
