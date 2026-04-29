import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import BudgetSettings from './BudgetSettings';

function renderBudgetSettings(overrides = {}) {
  const props = {
    monthlyIncome: 1000000,
    budgetSettings: {
      useManualBudget: false,
      manualDailyBudget: '',
      fixedExpenseAmount: '50000',
      emergencyFundAmount: '100000',
      goalEnabled: true,
      periodCalculationEnabled: true,
      carryOverEnabled: true,
      carryOverAmount: '20000',
    },
    savingGoalSettings: {
      goalAmount: '1000000',
      goalPeriod: '10',
      currentSaving: '200000',
    },
    recurringExpenses: [],
    dailyBudget: 50000,
    remainingDays: 12,
    onSave: vi.fn(),
    onToggleChange: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  };

  render(<BudgetSettings {...props} />);
  return props;
}

describe('BudgetSettings', () => {
  it('shows the save guidance and keeps preview values based on saved state until saving', () => {
    const onSave = vi.fn();
    const showToast = vi.fn();
    renderBudgetSettings({ onSave, showToast });

    expect(
      screen.getByText("입력한 값은 '저장하기'를 눌러야 적용됩니다.")
    ).toBeInTheDocument();
    expect(screen.getByText('50,000원')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('월 수입'), { target: { value: '2000000' } });

    expect(screen.getByText('50,000원')).toBeInTheDocument();
    expect(screen.getByText('저장되지 않은 변경사항이 있습니다.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    const saveButton = screen.getByRole('button', { name: '저장하기' });
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({
      monthlyIncome: '2000000',
      budgetSettings: {
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '50000',
        emergencyFundAmount: '100000',
        goalEnabled: true,
        periodCalculationEnabled: true,
        carryOverEnabled: true,
        carryOverAmount: '20000',
      },
      savingGoalSettings: {
        goalAmount: '1000000',
        goalPeriod: '10',
        currentSaving: '200000',
      },
    });
    expect(showToast).toHaveBeenCalledWith('예산 설정이 저장되었습니다');
  });

  it('validates numeric fields and blocks saving when invalid', () => {
    const onSave = vi.fn();
    renderBudgetSettings({ onSave });

    const incomeInput = screen.getByLabelText('월 수입');
    const saveButton = screen.getByRole('button', { name: '저장하기' });

    fireEvent.change(incomeInput, { target: { value: '0' } });

    expect(screen.getByText('월 수입은 0보다 큰 숫자로 입력해주세요.')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(incomeInput, { target: { value: 'abc' } });

    expect(screen.getByText('숫자만 입력할 수 있어요.')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(incomeInput, { target: { value: '1200000' } });

    expect(screen.queryByText('월 수입은 0보다 큰 숫자로 입력해주세요.')).not.toBeInTheDocument();
    expect(screen.queryByText('숫자만 입력할 수 있어요.')).not.toBeInTheDocument();
    expect(saveButton).toBeEnabled();
  });

  it('loads recurring expense total into the fixed expense field without saving immediately', () => {
    const onSave = vi.fn();
    const showToast = vi.fn();
    renderBudgetSettings({
      onSave,
      showToast,
      recurringExpenses: [
        { id: 'r1', amount: '120000' },
        { id: 'r2', amount: '12333' },
      ],
    });

    const loadButton = screen.getByRole('button', { name: '정기지출 합계 불러오기' });

    fireEvent.click(loadButton);

    expect(screen.getByLabelText('고정지출')).toHaveValue('132333');
    expect(
      screen.getByText('정기지출 합계 132,333원을 불러왔습니다. 저장하기를 눌러 적용하세요.')
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('정기지출 합계를 불러왔습니다');
  });

  it('shows a guide when there are no recurring expenses', () => {
    renderBudgetSettings({ recurringExpenses: [] });

    expect(screen.getByText('등록된 정기지출이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정기지출 합계 불러오기' })).toBeDisabled();
  });

  it('does not call the toggle handler immediately when switches change', () => {
    const onToggleChange = vi.fn();
    renderBudgetSettings({ onToggleChange });

    fireEvent.click(screen.getByRole('switch', { name: '수동 하루 예산 사용' }));

    expect(onToggleChange).not.toHaveBeenCalled();
  });

  it('keeps the goal card in sync with the saved state after saving', () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <BudgetSettings
        monthlyIncome={1000000}
        budgetSettings={{
          useManualBudget: false,
          manualDailyBudget: '',
          fixedExpenseAmount: '50000',
          emergencyFundAmount: '100000',
          goalEnabled: true,
          periodCalculationEnabled: true,
          carryOverEnabled: true,
          carryOverAmount: '20000',
        }}
        savingGoalSettings={{
          goalAmount: '1000000',
          goalPeriod: '10',
          currentSaving: '200000',
        }}
        dailyBudget={50000}
        remainingDays={12}
        onSave={onSave}
        onToggleChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('목표 금액'), { target: { value: '1500000' } });
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }));

    expect(onSave).toHaveBeenCalled();

    rerender(
      <BudgetSettings
        monthlyIncome={1000000}
        budgetSettings={{
          useManualBudget: false,
          manualDailyBudget: '',
          fixedExpenseAmount: '50000',
          emergencyFundAmount: '100000',
          goalEnabled: true,
          periodCalculationEnabled: true,
          carryOverEnabled: true,
          carryOverAmount: '20000',
        }}
        savingGoalSettings={{
          goalAmount: '1500000',
          goalPeriod: '10',
          currentSaving: '200000',
        }}
        dailyBudget={50000}
        remainingDays={12}
        onSave={onSave}
        onToggleChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('목표 금액')).toHaveValue('1500000');
  });
});
