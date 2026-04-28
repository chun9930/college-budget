import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import ExpenseRecords from './ExpenseRecords';

function createRecord(index, overrides = {}) {
  return {
    id: `record-${index}`,
    amount: 1000 * (index + 1),
    category: index === 0 ? '식비' : index % 2 === 0 ? '교통' : '쇼핑',
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
        category: '주거/공과금',
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
  };

  it('shows 10 recent records in quick input', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' }).closest('section');
    expect(section).toBeInTheDocument();
    expect(within(section).getAllByRole('button')).toHaveLength(10);
  });

  it('fills the form when a recent record is clicked', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button')[0]);

    expect(screen.getAllByLabelText('금액')[0]).toHaveValue(1000);
    expect(screen.getAllByLabelText('카테고리')[0]).toHaveValue('식비');
    expect(screen.getAllByLabelText('결제수단')[0]).toHaveValue('카드');
  });

  it('uses the most recent same-category payment method as the category default', () => {
    render(<ExpenseRecords {...baseProps} />);

    fireEvent.change(screen.getAllByLabelText('카테고리')[0], { target: { value: '교통' } });
    fireEvent.change(screen.getAllByLabelText('카테고리')[0], { target: { value: '식비' } });

    expect(screen.getAllByLabelText('결제수단')[0]).toHaveValue('카드');
  });

  it('keeps expense saving working', () => {
    const onAddExpenseRecord = vi.fn();

    render(<ExpenseRecords {...baseProps} onAddExpenseRecord={onAddExpenseRecord} />);

    fireEvent.change(screen.getAllByLabelText('금액')[0], { target: { value: '4200' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 저장' }));

    expect(onAddExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onAddExpenseRecord.mock.calls[0][0]).toMatchObject({
      amount: '4200',
      category: '식비',
      paymentMethod: '카드',
      date: '2026-04-28T00:00:00',
    });
  });

  it('renders 15 general expense categories and 5 recurring categories', () => {
    render(<ExpenseRecords {...baseProps} />);

    const generalSelect = screen.getAllByLabelText('카테고리')[0];
    const recurringSelect = screen.getAllByLabelText('카테고리')[1];

    expect(within(generalSelect).getAllByRole('option')).toHaveLength(15);
    expect(within(recurringSelect).getAllByRole('option')).toHaveLength(5);
    expect(within(generalSelect).queryByRole('option', { name: '주거/공과금' })).not.toBeInTheDocument();
    expect(within(recurringSelect).queryByRole('option', { name: '식비' })).not.toBeInTheDocument();
  });

  it('shows fallback option for existing category values that are not in the new list', () => {
    const fallbackProps = {
      ...baseProps,
      expenseRecords: [createRecord(0, { category: '과거카테고리', paymentMethod: '현금' })],
    };

    render(<ExpenseRecords {...fallbackProps} />);

    const section = screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button')[0]);

    expect(screen.getAllByLabelText('카테고리')[0]).toHaveValue('과거카테고리');
    expect(screen.getByRole('option', { name: '기존: 과거카테고리' })).toBeInTheDocument();
  });

  it('shows edit and delete buttons for general expense records', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '일반 지출 기록' }).closest('section');
    expect(section).toBeInTheDocument();
    expect(within(section).getAllByRole('button', { name: '수정' })).toHaveLength(10);
    expect(within(section).getAllByRole('button', { name: '삭제' })).toHaveLength(10);
  });

  it('fills the general expense form and enters edit mode when edit is clicked', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '일반 지출 기록' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button', { name: '수정' })[0]);

    expect(screen.getByText('지출 기록 수정 중')).toBeInTheDocument();
    expect(screen.getByText('1,000원 · 식비')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지출 수정 저장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정 취소' })).toBeInTheDocument();

    expect(screen.getAllByLabelText('금액')[0]).toHaveValue(1000);
    expect(screen.getAllByLabelText('카테고리')[0]).toHaveValue('식비');
    expect(screen.getAllByLabelText('결제수단')[0]).toHaveValue('카드');
    expect(screen.getAllByLabelText('지출 유형')[0]).toHaveValue('일반');
    expect(screen.getAllByLabelText('메모')[0]).toHaveValue('');
  });

  it('updates an existing general expense record instead of adding a new one', () => {
    const onUpdateExpenseRecord = vi.fn();
    const onAddExpenseRecord = vi.fn();

    render(
      <ExpenseRecords
        {...baseProps}
        onAddExpenseRecord={onAddExpenseRecord}
        onUpdateExpenseRecord={onUpdateExpenseRecord}
      />
    );

    const section = screen.getByRole('heading', { name: '일반 지출 기록' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button', { name: '수정' })[0]);

    fireEvent.change(screen.getAllByLabelText('금액')[0], { target: { value: '2500' } });
    fireEvent.change(screen.getAllByLabelText('메모')[0], { target: { value: '수정 메모' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 수정 저장' }));

    expect(onAddExpenseRecord).not.toHaveBeenCalled();
    expect(onUpdateExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onUpdateExpenseRecord).toHaveBeenCalledWith('record-0', {
      amount: '2500',
      category: '식비',
      paymentMethod: '카드',
      type: '일반',
      memo: '수정 메모',
    });
  });

  it('calls delete when general expense delete button is clicked', () => {
    const onDeleteExpenseRecord = vi.fn();

    render(
      <ExpenseRecords
        {...baseProps}
        onDeleteExpenseRecord={onDeleteExpenseRecord}
      />
    );

    const section = screen.getByRole('heading', { name: '일반 지출 기록' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button', { name: '삭제' })[0]);

    expect(onDeleteExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onDeleteExpenseRecord).toHaveBeenCalledWith('record-0');
  });

  it('shows edit and delete buttons for recurring expenses', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '정기지출' }).closest('section');
    expect(section).toBeInTheDocument();
    expect(within(section).getAllByRole('button', { name: '수정' })).toHaveLength(1);
    expect(within(section).getAllByRole('button', { name: '삭제' })).toHaveLength(1);
  });

  it('fills the recurring form when edit is clicked and allows canceling edit mode', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '정기지출' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button', { name: '수정' })[0]);

    expect(screen.getByText('정기지출 수정 중')).toBeInTheDocument();
    expect(screen.getByText('넷플릭스 · 17,000원')).toBeInTheDocument();
    expect(screen.getByDisplayValue('넷플릭스')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정기지출 수정 저장' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '수정 취소' }));

    expect(screen.queryByText('정기지출 수정 중')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정기지출 저장' })).toBeInTheDocument();
    expect(screen.getByLabelText('항목명')).toHaveValue('');
  });

  it('calls update instead of add when recurring expense is edited', () => {
    const onUpdateRecurringExpense = vi.fn();

    render(
      <ExpenseRecords
        {...baseProps}
        onUpdateRecurringExpense={onUpdateRecurringExpense}
      />
    );

    const section = screen.getByRole('heading', { name: '정기지출' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button', { name: '수정' })[0]);
    fireEvent.change(screen.getByLabelText('항목명'), { target: { value: '유튜브 프리미엄' } });
    fireEvent.click(screen.getByRole('button', { name: '정기지출 수정 저장' }));

    expect(onUpdateRecurringExpense).toHaveBeenCalledTimes(1);
    expect(onUpdateRecurringExpense).toHaveBeenCalledWith('recurring-1', {
      name: '유튜브 프리미엄',
      amount: '17000',
      category: '주거/공과금',
      paymentDay: '5',
      paymentMethod: '카드',
      memo: '가족 공유 요금',
    });
  });

  it('calls delete when recurring expense delete button is clicked', () => {
    const onDeleteRecurringExpense = vi.fn();

    render(
      <ExpenseRecords
        {...baseProps}
        onDeleteRecurringExpense={onDeleteRecurringExpense}
      />
    );

    const section = screen.getByRole('heading', { name: '정기지출' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button', { name: '삭제' })[0]);

    expect(onDeleteRecurringExpense).toHaveBeenCalledTimes(1);
    expect(onDeleteRecurringExpense).toHaveBeenCalledWith('recurring-1');
  });
});
