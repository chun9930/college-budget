import { beforeEach, describe, expect, it } from 'vitest';
import { login } from './auth';
import {
  clearAllStorage,
  getAccountSnapshot,
  KEYS,
  loadNormalizedServiceState,
  loadJSON,
  normalizeStoredAccountSnapshot,
  saveAccountSnapshot,
  saveJSON,
  seedMockDataIfNeeded,
} from './storage';

describe('seedMockDataIfNeeded', () => {
  beforeEach(() => {
    clearAllStorage();
    window.localStorage.removeItem('notificationHistory');
  });

  it('seeds mock accounts and demo data only when storage is empty', () => {
    seedMockDataIfNeeded();

    expect(loadJSON(KEYS.users, [])).toEqual([
      {
        name: '테스트사용자',
        email: '1234@naver.com',
        password: '1234',
      },
      {
        name: '대학생테스트',
        email: 'student@pingo.com',
        password: '12345',
      },
    ]);

    expect(loadJSON(KEYS.monthlyIncome, 0)).toBe(2000000);
    expect(loadJSON(KEYS.budgetSettings, null)).toMatchObject({
      fixedExpenseAmount: '0',
      carryOverEnabled: true,
    });
    expect(loadJSON(KEYS.savingGoalSettings, null)).toMatchObject({
      goalAmount: '2000000',
      goalPeriod: '222',
      currentSaving: '0',
    });
    expect(loadJSON(KEYS.savingGoals, [])).toHaveLength(3);
    expect(loadJSON(KEYS.recurringExpenses, [])).toHaveLength(6);
    expect(loadJSON(KEYS.expenseRecords, [])).toHaveLength(9);
    expect(loadJSON(KEYS.loginState, null)).toBeNull();
    expect(loadJSON(KEYS.userProfile, null)).toBeNull();

    expect(getAccountSnapshot('1234@naver.com')).toMatchObject({
      monthlyIncome: 2000000,
      savingGoals: expect.any(Array),
    });
    expect(getAccountSnapshot('student@pingo.com')).toMatchObject({
      recurringExpenses: [],
    });
  });

  it('allows the seeded accounts to log in', () => {
    seedMockDataIfNeeded();

    expect(login({ email: '1234@naver.com', password: '1234' }).ok).toBe(true);
    expect(login({ email: 'student@pingo.com', password: '12345' }).ok).toBe(true);
  });

  it('does not overwrite existing localStorage data', () => {
    saveJSON(KEYS.users, [
      {
        name: '기존사용자',
        email: 'existing@example.com',
        password: 'pw',
      },
    ]);

    seedMockDataIfNeeded();

    expect(loadJSON(KEYS.users, [])).toEqual([
      {
        name: '기존사용자',
        email: 'existing@example.com',
        password: 'pw',
      },
      {
        name: '테스트사용자',
        email: '1234@naver.com',
        password: '1234',
      },
      {
        name: '대학생테스트',
        email: 'student@pingo.com',
        password: '12345',
      },
    ]);
  });

  it('does not duplicate the seeded accounts on repeated runs', () => {
    seedMockDataIfNeeded();
    seedMockDataIfNeeded();

    const users = loadJSON(KEYS.users, []);
    const seededEmails = users.filter((user) =>
      ['1234@naver.com', 'student@pingo.com'].includes(user.email)
    );

    expect(seededEmails).toHaveLength(2);
    expect(users.filter((user) => user.email === '1234@naver.com')).toHaveLength(1);
    expect(users.filter((user) => user.email === 'student@pingo.com')).toHaveLength(1);
  });
});

describe('storage normalization', () => {
  beforeEach(() => {
    clearAllStorage();
    window.localStorage.removeItem('notificationHistory');
  });

  it('fills missing snapshot fields with safe defaults', () => {
    const normalized = normalizeStoredAccountSnapshot({
      monthlyIncome: 1200000,
      budgetSettings: {
        fixedExpenseAmount: '5000',
        incomeMode: 'work',
      },
      savingGoalSettings: {
        goalAmount: '1000000',
      },
      recurringExpenses: [{ id: 'rec-1', amount: '10000', paymentDay: '5' }],
      expenseRecords: [{ id: 'exp-1', amount: '2000', sourceRecurringId: 'rec-1' }],
    });

    expect(normalized.monthlyIncome).toBe(1200000);
    expect(normalized.budgetSettings.fixedExpenseAmount).toBe('5000');
    expect(normalized.budgetSettings.incomeMode).toBe('work');
    expect(normalized.savingGoals).toEqual([]);
    expect(normalized.carryOverState).toEqual({
      lastCalculatedMonth: '',
      monthlySnapshots: {},
    });
    expect(normalized.expenseRecords[0]).toMatchObject({
      sourceRecurringId: 'rec-1',
      amount: '2000',
    });
    expect(Object.prototype.hasOwnProperty.call(normalized, 'currentDate')).toBe(false);
  });

  it('merges notification history into alert history without duplicates', () => {
    const normalized = normalizeStoredAccountSnapshot({
      alertHistory: [
        {
          id: 'alert-1',
          statusKey: 'safe',
          statusLabel: '안전',
          message: '기존 알림',
          createdAt: '2026-05-01T00:00:00.000Z',
          read: false,
        },
      ],
      notificationHistory: [
        {
          id: 'alert-1',
          statusKey: 'safe',
          statusLabel: '안전',
          message: '기존 알림',
          createdAt: '2026-05-01T00:00:00.000Z',
          read: false,
        },
        {
          id: 'legacy-2',
          statusKey: 'danger',
          statusLabel: '위험',
          message: '이월 알림',
          createdAt: '2026-05-01T01:00:00.000Z',
          read: false,
        },
      ],
    });

    expect(normalized.alertHistory).toHaveLength(2);
    expect(normalized.alertHistory.map((item) => item.id)).toEqual(['alert-1', 'legacy-2']);
  });

  it('keeps existing values when saving normalized account snapshots', () => {
    saveAccountSnapshot('legacy@example.com', {
      monthlyIncome: '1500000',
      budgetSettings: {
        fixedExpenseAmount: '5000',
      },
      savingGoalSettings: {
        goalAmount: '1000000',
      },
      savingGoals: [{ id: 'g-1', name: '노트북', targetAmount: '1000000', currentAmount: '0' }],
      alertHistory: [
        {
          id: 'a-1',
          statusKey: 'safe',
          statusLabel: '안전',
          message: '알림',
          createdAt: '2026-05-01T00:00:00.000Z',
          read: false,
        },
      ],
    });

    const snapshot = getAccountSnapshot('legacy@example.com');

    expect(snapshot.monthlyIncome).toBe(1500000);
    expect(snapshot.budgetSettings.fixedExpenseAmount).toBe('5000');
    expect(snapshot.savingGoals).toHaveLength(1);
    expect(snapshot.alertHistory).toHaveLength(1);
    expect(snapshot.carryOverState).toEqual({
      lastCalculatedMonth: '',
      monthlySnapshots: {},
    });
  });

  it('loads normalized service state from top-level fallback keys', () => {
    saveJSON(KEYS.monthlyIncome, 123);
    saveJSON(KEYS.budgetSettings, { fixedExpenseAmount: '7000' });
    saveJSON(KEYS.alertHistory, [
      {
        id: 'alert-1',
        statusKey: 'safe',
        statusLabel: '안전',
        message: '현재 알림',
        createdAt: '2026-05-01T00:00:00.000Z',
        read: false,
      },
    ]);
    saveJSON('notificationHistory', [
      {
        id: 'legacy-1',
        statusKey: 'caution',
        statusLabel: '주의',
        message: '이전 알림',
        createdAt: '2026-05-01T01:00:00.000Z',
        read: false,
      },
    ]);

    const state = loadNormalizedServiceState('');

    expect(state.monthlyIncome).toBe(123);
    expect(state.budgetSettings.fixedExpenseAmount).toBe('7000');
    expect(state.alertHistory).toHaveLength(2);
    expect(state.savingGoals).toEqual([]);
    expect(state.carryOverState).toEqual({
      lastCalculatedMonth: '',
      monthlySnapshots: {},
    });
  });
});
