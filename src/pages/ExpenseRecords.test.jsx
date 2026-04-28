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
    paymentMethod: index === 0 ? '현금' : index % 2 === 0 ? '카드' : '이체',
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
        category: '구독',
        paymentDay: '5',
        paymentMethod: '카드',
        memo: '가족 요금제',
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
    expect(screen.queryByText('템플릿')).not.toBeInTheDocument();
  });

  it('fills the form when a recent record is clicked', () => {
    render(<ExpenseRecords {...baseProps} />);

    const section = screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' }).closest('section');
    fireEvent.click(within(section).getAllByRole('button')[0]);

    expect(screen.getAllByLabelText('금액')[0]).toHaveValue(1000);
    expect(screen.getAllByLabelText('카테고리')[0]).toHaveValue('식비');
    expect(screen.getAllByLabelText('결제수단')[0]).toHaveValue('현금');
  });

  it('uses the most recent same-category payment method as the category default', () => {
    render(<ExpenseRecords {...baseProps} />);

    fireEvent.change(screen.getAllByLabelText('카테고리')[0], { target: { value: '교통' } });
    fireEvent.change(screen.getAllByLabelText('카테고리')[0], { target: { value: '식비' } });

    expect(screen.getAllByLabelText('결제수단')[0]).toHaveValue('현금');
  });

  it('keeps expense saving working', () => {
    const onAddExpenseRecord = vi.fn();

    render(
      <ExpenseRecords
        {...baseProps}
        onAddExpenseRecord={onAddExpenseRecord}
      />
    );

    fireEvent.change(screen.getAllByLabelText('금액')[0], { target: { value: '4200' } });
    fireEvent.click(screen.getByRole('button', { name: '지출 저장' }));

    expect(onAddExpenseRecord).toHaveBeenCalledTimes(1);
    expect(onAddExpenseRecord.mock.calls[0][0]).toMatchObject({
      amount: '4200',
      category: '식비',
      paymentMethod: '카드',
    });
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
    expect(screen.getByText('2,000원 · 교통')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지출 수정 저장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정 취소' })).toBeInTheDocument();

    expect(screen.getAllByLabelText('금액')[0]).toHaveValue(2000);
    expect(screen.getAllByLabelText('카테고리')[0]).toHaveValue('교통');
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
      paymentMethod: '현금',
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

    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('fills the recurring form when edit is clicked and allows canceling edit mode', () => {
    render(<ExpenseRecords {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

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

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    fireEvent.change(screen.getByLabelText('항목명'), { target: { value: '유튜브 프리미엄' } });
    fireEvent.click(screen.getByRole('button', { name: '정기지출 수정 저장' }));

    expect(onUpdateRecurringExpense).toHaveBeenCalledTimes(1);
    expect(onUpdateRecurringExpense).toHaveBeenCalledWith('recurring-1', {
      name: '유튜브 프리미엄',
      amount: '17000',
      category: '구독',
      paymentDay: '5',
      paymentMethod: '카드',
      memo: '가족 요금제',
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

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(onDeleteRecurringExpense).toHaveBeenCalledTimes(1);
    expect(onDeleteRecurringExpense).toHaveBeenCalledWith('recurring-1');
  });
});
