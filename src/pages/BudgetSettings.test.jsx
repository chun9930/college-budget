import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BudgetSettings from './BudgetSettings';

afterEach(cleanup);

function renderBudgetSettings(overrides = {}) {
  const props = {
    monthlyIncome: 1000000,
    budgetSettings: {
      incomeMode: 'direct',
      hourlyWage: '',
      workHoursPerDay: '',
      workDaysPerWeek: '',
      useManualBudget: false,
      manualDailyBudget: '',
      fixedExpenseAmount: '50000',
      autoIncludeRecurringExpenses: false,
      emergencyFundAmount: '100000',
      goalEnabled: true,
      periodCalculationEnabled: true,
      carryOverEnabled: true,
      carryOverAmount: '20000',
      manualCarryOverEnabled: false,
      manualCarryOverAmount: '',
    },
    savingGoalSettings: {
      goalAmount: '1000000',
      goalPeriod: '10',
      currentSaving: '200000',
    },
    recurringExpenses: [],
    savingGoals: [],
    dailyBudget: 50000,
    remainingDays: 12,
    automaticCarryOverAmount: 20000,
    totalFixedExpense: 50000,
    monthlyJudgmentSnapshot: {
      statusKey: 'safe',
      statusLabel: '안전',
      message: '이번 달 380,000원 더 쓸 수 있어요',
      description: '이번 달 예산이 아직 여유가 있어요.',
      relatedAmount: 380000,
    },
    onSave: vi.fn(),
    onSavingGoalsChange: vi.fn(),
    onToggleChange: vi.fn(),
    showToast: vi.fn(),
    ...overrides,
  };

  const renderResult = render(<BudgetSettings {...props} />);
  return { ...props, ...renderResult };
}

describe('BudgetSettings', () => {
  it('shows saved values without load button and saves on submit', () => {
    const onSave = vi.fn();
    const showToast = vi.fn();
    const { container } = renderBudgetSettings({ onSave, showToast });

    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes('예산에 반영되는 고정지출')
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByText('이번 달 380,000원 더 쓸 수 있어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '정기지출 합계 불러오기' })).not.toBeInTheDocument();

    fireEvent.change(container.querySelector('#fixedExpenseAmount'), {
      target: { value: '2000000' },
    });
    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetSettings: expect.objectContaining({ fixedExpenseAmount: '2000000' }),
      })
    );
    expect(showToast).toHaveBeenCalled();
  });

  it('validates numeric fields and blocks saving when invalid', () => {
    const { container } = renderBudgetSettings();

    const incomeInput = container.querySelector('#monthlyIncome');
    const saveButton = container.querySelector('button[type="submit"]');

    fireEvent.change(incomeInput, { target: { value: '-1' } });

    expect(incomeInput).toHaveAttribute('aria-invalid', 'true');
    expect(saveButton).toBeDisabled();

    fireEvent.change(incomeInput, { target: { value: 'abc' } });

    expect(incomeInput).toHaveAttribute('aria-invalid', 'true');
    expect(saveButton).toBeDisabled();

    fireEvent.change(incomeInput, { target: { value: '1200000' } });

    expect(incomeInput).toHaveAttribute('aria-invalid', 'false');
    expect(saveButton).toBeEnabled();
  });

  it('normalizes empty money fields to 0 when saving', () => {
    const onSave = vi.fn();
    const { container } = renderBudgetSettings({
      onSave,
      monthlyIncome: 1000000,
      budgetSettings: {
        incomeMode: 'direct',
        hourlyWage: '',
        workHoursPerDay: '',
        workDaysPerWeek: '',
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '',
        autoIncludeRecurringExpenses: false,
        emergencyFundAmount: '',
        goalEnabled: false,
        periodCalculationEnabled: false,
        carryOverEnabled: true,
        carryOverAmount: '',
        manualCarryOverEnabled: false,
        manualCarryOverAmount: '',
      },
      savingGoalSettings: {
        goalAmount: '',
        goalPeriod: '',
        currentSaving: '',
      },
      automaticCarryOverAmount: 0,
      totalFixedExpense: 0,
    });

    fireEvent.change(container.querySelector('#monthlyIncome'), { target: { value: '' } });
    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyIncome: '0',
        budgetSettings: expect.objectContaining({
          fixedExpenseAmount: '0',
          emergencyFundAmount: '0',
          carryOverAmount: '0',
        }),
      })
    );
  });

  it('saves direct monthly income as entered', () => {
    const onSave = vi.fn();
    const { container } = renderBudgetSettings({ onSave });

    fireEvent.change(container.querySelector('#monthlyIncome'), {
      target: { value: '1234567' },
    });
    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyIncome: '1234567',
        budgetSettings: expect.objectContaining({
          incomeMode: 'direct',
        }),
      })
    );
  });

  it('saves calculated monthly income from work condition mode', () => {
    const onSave = vi.fn();
    const { container } = renderBudgetSettings({ onSave });

    fireEvent.click(container.querySelectorAll('.choice-button')[1]);
    fireEvent.change(container.querySelector('#hourlyWage'), { target: { value: '10000' } });
    fireEvent.change(container.querySelector('#workHoursPerDay'), { target: { value: '4' } });
    fireEvent.change(container.querySelector('#workDaysPerWeek'), { target: { value: '5' } });

    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('869,000')).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('계산된 예상 월수입은 저장하면 monthlyIncome에 반영됩니다.')
    ).toBeInTheDocument();

    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyIncome: '869000',
        budgetSettings: expect.objectContaining({
          incomeMode: 'work',
          hourlyWage: '10000',
          workHoursPerDay: '4',
          workDaysPerWeek: '5',
        }),
      })
    );
  });

  it('shows recurring expense summary and keeps load button hidden', () => {
    renderBudgetSettings({
      recurringExpenses: [
        { id: 'r1', amount: '120000' },
        { id: 'r2', amount: '12333' },
      ],
      totalFixedExpense: 162333,
    });

    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes('정기지출 합계')
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes('예산에 반영되는 고정지출')
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('이번 달 자동 이월은 지난달 기준으로 한 번만 계산되고, 같은 달에는 저장된 값을 다시 사용합니다.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '정기지출 합계 불러오기' })).not.toBeInTheDocument();
  });

  it('shows a guide when there are no recurring expenses', () => {
    renderBudgetSettings({ recurringExpenses: [] });

    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes('등록된 정기지출이 없습니다')
      ).length
    ).toBeGreaterThan(0);
  });

  it('renders saving goal list cards with calculations', () => {
    renderBudgetSettings({
      savingGoals: [
        {
          id: 'goal-1',
          name: '여행 자금',
          category: '여행',
          targetAmount: '1000000',
          currentAmount: '250000',
          deadline: '2026-08-31',
        },
      ],
    });

    fireEvent.click(screen.getByRole('tab', { name: '목표 계획 목록' }));

    expect(screen.getByRole('heading', { name: '목표 계획 목록' })).toBeInTheDocument();
    expect(screen.getByText('여행 자금')).toBeInTheDocument();
    expect(screen.getByText('남은 금액')).toBeInTheDocument();
    expect(screen.getAllByText('목표 금액').length).toBeGreaterThan(0);
  });

  it('adds and updates saving goals without touching budget submit button', () => {
    const onSavingGoalsChange = vi.fn();
    renderBudgetSettings({ onSavingGoalsChange });

    fireEvent.click(screen.getByRole('tab', { name: '목표 계획 목록' }));

    fireEvent.change(screen.getByLabelText('목표명(목록)'), { target: { value: '노트북 구매' } });
    fireEvent.change(screen.getByLabelText('목표 금액(목록)'), { target: { value: '1500000' } });
    fireEvent.change(screen.getByLabelText('현재 저축액(목록)'), { target: { value: '200000' } });
    fireEvent.change(screen.getByLabelText('마감일(목록)'), { target: { value: '2026-10-15' } });
    fireEvent.click(screen.getByRole('button', { name: '목표 추가' }));

    expect(onSavingGoalsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: '노트북 구매',
          category: '여행',
          targetAmount: '1500000',
          currentAmount: '200000',
          deadline: '2026-10-15',
        }),
      ])
    );
  });

  it('edits and deletes an existing saving goal card', () => {
    const onSavingGoalsChange = vi.fn();
    renderBudgetSettings({
      onSavingGoalsChange,
      savingGoals: [
        {
          id: 'goal-1',
          name: '여행 자금',
          category: '여행',
          targetAmount: '1000000',
          currentAmount: '250000',
          deadline: '2026-08-31',
        },
      ],
    });

    fireEvent.click(screen.getByRole('tab', { name: '목표 계획 목록' }));

    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    fireEvent.change(screen.getByLabelText('목표명(목록)'), { target: { value: '여행 자금 수정' } });
    fireEvent.click(screen.getByRole('button', { name: '목표 수정 저장' }));

    expect(onSavingGoalsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'goal-1',
          name: '여행 자금 수정',
        }),
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(onSavingGoalsChange).toHaveBeenLastCalledWith([]);
  });

  it('turns goal settings off when goal period is 0 on save', () => {
    const onSave = vi.fn();
    const { container } = renderBudgetSettings({ onSave });

    fireEvent.change(container.querySelector('#goalPeriod'), { target: { value: '0' } });
    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetSettings: expect.objectContaining({
          goalEnabled: false,
          periodCalculationEnabled: false,
        }),
      })
    );
  });

  it('turns manual carry over off when manual amount is invalid', () => {
    const onSave = vi.fn();
    const { container } = renderBudgetSettings({
      onSave,
      automaticCarryOverAmount: 100000,
      budgetSettings: {
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '0',
        emergencyFundAmount: '0',
        goalEnabled: false,
        periodCalculationEnabled: false,
        carryOverEnabled: true,
        carryOverAmount: '100000',
        manualCarryOverEnabled: true,
        manualCarryOverAmount: '50000',
      },
      savingGoalSettings: {
        goalAmount: '',
        goalPeriod: '',
        currentSaving: '',
      },
    });

    fireEvent.change(container.querySelector('#manualCarryOverAmount'), { target: { value: '0' } });
    fireEvent.click(container.querySelector('button[type="submit"]'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetSettings: expect.objectContaining({
          manualCarryOverEnabled: false,
          manualCarryOverAmount: '0',
          carryOverAmount: '100000',
        }),
      })
    );
  });

  it('does not call the toggle handler immediately when switches change', () => {
    const onToggleChange = vi.fn();
    const { container } = renderBudgetSettings({ onToggleChange });

    fireEvent.click(container.querySelector('#useManualBudget'));

    expect(onToggleChange).not.toHaveBeenCalled();
  });
});
