import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import BudgetSettings from './BudgetSettings';

describe('BudgetSettings', () => {
  it('saves toggle state immediately when a switch changes', () => {
    const onToggleChange = vi.fn();

    render(
      <BudgetSettings
        monthlyIncome={1000000}
        budgetSettings={{
          useManualBudget: false,
          manualDailyBudget: '',
          fixedExpenseAmount: '',
          emergencyFundAmount: '',
          goalEnabled: true,
          periodCalculationEnabled: true,
          carryOverEnabled: true,
          carryOverAmount: '',
        }}
        savingGoalSettings={{
          goalAmount: '',
          goalPeriod: '',
          currentSaving: '',
        }}
        dailyBudget={0}
        remainingDays={1}
        onSave={vi.fn()}
        onToggleChange={onToggleChange}
      />
    );

    fireEvent.click(screen.getAllByRole('switch')[0]);

    expect(onToggleChange).toHaveBeenCalledWith('useManualBudget', true);
  });
});
