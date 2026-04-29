import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import { calculateDailyBudget, calculateGoalSavingPlan, getRemainingDaysIncludingToday } from './lib/budget';
import { getAlertState } from './lib/alert';
import { applyRecurringExpenses } from './lib/recurring';
import { KEYS } from './lib/storage';

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
    expect(screen.getByRole('button', { name: '분석 보러가기' })).toBeInTheDocument();
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
