import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HashRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import {
  calculateAutomaticCarryOver,
  calculateDailyBudget,
  calculateGoalSavingPlan,
  calculateSavingGoalListSummary,
  getRemainingDaysIncludingToday,
} from './lib/budget';
import { getAlertState, getMonthlyJudgmentSnapshot } from './lib/alert';
import { applyRecurringExpenses } from './lib/recurring';
import { KEYS } from './lib/storage';

afterEach(cleanup);

function seedAuth() {
  window.localStorage.setItem(
    KEYS.loginState,
    JSON.stringify({
      userId: 'hong@example.com',
      email: 'hong@example.com',
      isLoggedIn: true,
      loggedInAt: '2026-04-29T09:00:00.000Z',
    })
  );
  window.localStorage.setItem(
    KEYS.userProfile,
    JSON.stringify({
      userId: 'hong@example.com',
      name: '홍길동',
      email: 'hong@example.com',
    })
  );
}

describe('college budget app', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  it('redirects anonymous users to login on protected pages', () => {
    window.location.hash = '#/budget-settings';

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주요 페이지' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '하단 메뉴' })).not.toBeInTheDocument();
  });

  it('keeps login route public and hides chrome on auth pages', () => {
    window.location.hash = '#/login';

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주요 페이지' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '하단 메뉴' })).not.toBeInTheDocument();
  });

  it('renders the home screen only after login', () => {
    seedAuth();

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '분석 보러가기' })).toBeInTheDocument();
  });

  it('shows the login screen after logging out from an authenticated session', () => {
    seedAuth();
    window.location.hash = '#/';

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '주요 페이지' })).not.toBeInTheDocument();
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

  it('shows saved fixed expense without recurring total when auto inclusion is off', () => {
    seedAuth();
    window.localStorage.setItem(KEYS.monthlyIncome, JSON.stringify(1000000));
    window.localStorage.setItem(
      KEYS.budgetSettings,
      JSON.stringify({
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '5000',
        emergencyFundAmount: '0',
        goalEnabled: false,
        periodCalculationEnabled: false,
        carryOverEnabled: false,
        carryOverAmount: '0',
        manualCarryOverEnabled: false,
        manualCarryOverAmount: '0',
        autoIncludeRecurringExpenses: false,
      })
    );
    window.localStorage.setItem(
      KEYS.recurringExpenses,
      JSON.stringify([{ id: 'r1', name: '넷플릭스', amount: '10000', paymentDay: 15 }])
    );

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByText('5,000원')).toBeInTheDocument();
  });

  it('includes recurring total in fixed expense when auto inclusion is on', () => {
    seedAuth();
    window.localStorage.setItem(KEYS.monthlyIncome, JSON.stringify(1000000));
    window.localStorage.setItem(
      KEYS.budgetSettings,
      JSON.stringify({
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '5000',
        emergencyFundAmount: '0',
        goalEnabled: false,
        periodCalculationEnabled: false,
        carryOverEnabled: false,
        carryOverAmount: '0',
        manualCarryOverEnabled: false,
        manualCarryOverAmount: '0',
        autoIncludeRecurringExpenses: true,
      })
    );
    window.localStorage.setItem(
      KEYS.recurringExpenses,
      JSON.stringify([{ id: 'r1', name: '넷플릭스', amount: '10000', paymentDay: 15 }])
    );

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByText('15,000원')).toBeInTheDocument();
  });

  it('excludes source recurring expense records from budget calculation when auto inclusion is on', () => {
    seedAuth();
    const now = new Date();
    const currentMonthDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      9,
      0,
      0
    ).toISOString();
    const remainingDays = getRemainingDaysIncludingToday(now);
    const expectedDailyBudget = Math.round((100000 - 15000 - 20000) / remainingDays);

    window.localStorage.setItem(KEYS.monthlyIncome, JSON.stringify(100000));
    window.localStorage.setItem(
      KEYS.budgetSettings,
      JSON.stringify({
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '5000',
        emergencyFundAmount: '0',
        goalEnabled: false,
        periodCalculationEnabled: false,
        carryOverEnabled: false,
        carryOverAmount: '0',
        manualCarryOverEnabled: false,
        manualCarryOverAmount: '0',
        autoIncludeRecurringExpenses: true,
      })
    );
    window.localStorage.setItem(
      KEYS.recurringExpenses,
      JSON.stringify([{ id: 'rec-1', amount: '10000', paymentDay: 32 }])
    );
    window.localStorage.setItem(
      KEYS.expenseRecords,
      JSON.stringify([
        {
          id: 'source-1',
          date: currentMonthDate,
          amount: '30000',
          sourceRecurringId: 'rec-1',
        },
        {
          id: 'normal-1',
          date: currentMonthDate,
          amount: '20000',
        },
      ])
    );

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByText(`${expectedDailyBudget.toLocaleString()}원`)).toBeInTheDocument();
  });

  it('includes source recurring expense records in budget calculation when auto inclusion is off', () => {
    seedAuth();
    const now = new Date();
    const currentMonthDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      9,
      0,
      0
    ).toISOString();
    const remainingDays = getRemainingDaysIncludingToday(now);
    const expectedDailyBudget = Math.round((100000 - 5000 - 50000) / remainingDays);

    window.localStorage.setItem(KEYS.monthlyIncome, JSON.stringify(100000));
    window.localStorage.setItem(
      KEYS.budgetSettings,
      JSON.stringify({
        useManualBudget: false,
        manualDailyBudget: '',
        fixedExpenseAmount: '5000',
        emergencyFundAmount: '0',
        goalEnabled: false,
        periodCalculationEnabled: false,
        carryOverEnabled: false,
        carryOverAmount: '0',
        manualCarryOverEnabled: false,
        manualCarryOverAmount: '0',
        autoIncludeRecurringExpenses: false,
      })
    );
    window.localStorage.setItem(
      KEYS.recurringExpenses,
      JSON.stringify([{ id: 'rec-1', amount: '10000', paymentDay: 32 }])
    );
    window.localStorage.setItem(
      KEYS.expenseRecords,
      JSON.stringify([
        {
          id: 'source-1',
          date: currentMonthDate,
          amount: '30000',
          sourceRecurringId: 'rec-1',
        },
        {
          id: 'normal-1',
          date: currentMonthDate,
          amount: '20000',
        },
      ])
    );

    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByText(`${expectedDailyBudget.toLocaleString()}원`)).toBeInTheDocument();
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

  it('calculates saving goal list summaries safely', () => {
    const summary = calculateSavingGoalListSummary(
      [
        {
          id: 'goal-1',
          name: '여행 자금',
          category: '여행',
          targetAmount: '1000000',
          currentAmount: '250000',
          deadline: '2026-08-31',
        },
        {
          id: 'goal-2',
          name: '비상금',
          category: '비상금',
          targetAmount: '0',
          currentAmount: '50000',
          deadline: '2026-04-01',
        },
        {
          id: 'goal-3',
          name: '노트북',
          category: '전자기기',
          targetAmount: '1000000',
          currentAmount: '1200000',
          deadline: '2026-04-01',
        },
      ],
      new Date('2026-04-30T09:00:00')
    );

    expect(summary[0]).toMatchObject({
      remainingAmount: 750000,
      achievementRate: 25,
    });
    expect(summary[0].remainingDays).toBeGreaterThan(0);
    expect(summary[0].dailyNeed).toBeGreaterThan(0);
    expect(summary[0].monthlyNeed).toBeGreaterThan(0);

    expect(summary[1]).toMatchObject({
      remainingAmount: 0,
      achievementRate: 0,
      remainingDays: 0,
      dailyNeed: 0,
      monthlyNeed: 0,
      isOverdue: false,
    });

    expect(summary[2]).toMatchObject({
      remainingAmount: 0,
      achievementRate: 120,
      isCompleted: true,
    });
  });

  it('switches alert state by usage rate', () => {
    expect(getAlertState({ spent: 60, dailyBudget: 100 }).key).toBe('safe');
    expect(getAlertState({ spent: 70, dailyBudget: 100 }).key).toBe('caution');
    expect(getAlertState({ spent: 90, dailyBudget: 100 }).key).toBe('danger');
    expect(getAlertState({ spent: 100, dailyBudget: 100 }).key).toBe('over');
  });

  it('calculates automatic carryover without re-adding existing carryOver', () => {
    expect(
      calculateAutomaticCarryOver({
        monthlyIncome: 100000,
        fixedExpenses: 15000,
        targetSavings: 20000,
        emergencyFund: 5000,
        spent: 30000,
      })
    ).toBe(30000);
  });

  it('separates monthly budget judgment from daily judgment', () => {
    const snapshot = getMonthlyJudgmentSnapshot({
      hasBudgetSetup: true,
      monthlyBudget: 100000,
      monthSpent: 73000,
    });

    expect(snapshot.statusKey).toBe('caution');
    expect(snapshot.message).toBe('이번 달 예산의 73%를 사용했어요');
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
