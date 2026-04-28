import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { calculateDailyBudget, calculateGoalSavingPlan, getRemainingDaysIncludingToday } from './lib/budget';
import { getAlertState } from './lib/alert';
import { applyRecurringExpenses } from './lib/recurring';

describe('college budget app', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  it('renders home screen', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByRole('heading', { name: '홈' })).toBeInTheDocument();
    expect(screen.getByText('오늘 사용 가능 금액')).toBeInTheDocument();
  });

  it('renders login route', () => {
    window.location.hash = '#/login';

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('calculates daily budget with manual priority', () => {
    expect(
      calculateDailyBudget({
        monthlyIncome: 1000000,
        manualDailyBudget: 25000,
        carryOver: 10000,
        targetSavings: 50000,
        emergencyFund: 20000,
        fixedExpenses: 100000,
        remainingDays: 10,
      })
    ).toBe(25000);
  });

  it('uses remaining days including today', () => {
    expect(getRemainingDaysIncludingToday(new Date('2026-04-10T12:00:00'))).toBe(21);
  });

  it('calculates goal saving plan', () => {
    expect(
      calculateGoalSavingPlan({
        goalAmount: 100000,
        currentSaving: 25000,
        goalPeriod: 5,
      }).dailyNeed
    ).toBe(15000);
  });

  it('switches alert state by usage rate', () => {
    expect(getAlertState({ spent: 60, dailyBudget: 100 }).key).toBe('safe');
    expect(getAlertState({ spent: 70, dailyBudget: 100 }).key).toBe('caution');
    expect(getAlertState({ spent: 90, dailyBudget: 100 }).key).toBe('danger');
    expect(getAlertState({ spent: 100, dailyBudget: 100 }).key).toBe('over');
  });

  it('adds recurring expense once per month day', () => {
    const records = applyRecurringExpenses(
      [],
      [
        {
          id: 'rec-1',
          name: '넷플릭스',
          amount: 17000,
          category: '구독',
          paymentDay: 5,
          paymentMethod: '카드',
          memo: '',
        },
      ],
      new Date('2026-04-05T09:00:00')
    );

    const duplicateRecords = applyRecurringExpenses(
      records,
      [
        {
          id: 'rec-1',
          name: '넷플릭스',
          amount: 17000,
          category: '구독',
          paymentDay: 5,
          paymentMethod: '카드',
          memo: '',
        },
      ],
      new Date('2026-04-05T10:00:00')
    );

    expect(records).toHaveLength(1);
    expect(duplicateRecords).toHaveLength(1);
  });
});
