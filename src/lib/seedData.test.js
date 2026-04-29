import { beforeEach, describe, expect, it } from 'vitest';
import { login } from './auth';
import {
  clearAllStorage,
  getAccountSnapshot,
  KEYS,
  loadJSON,
  saveJSON,
  seedMockDataIfNeeded,
} from './storage';

describe('seedMockDataIfNeeded', () => {
  beforeEach(() => {
    clearAllStorage();
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
    expect(loadJSON(KEYS.recurringExpenses, [])).toHaveLength(6);
    expect(loadJSON(KEYS.expenseRecords, [])).toHaveLength(9);
    expect(loadJSON(KEYS.loginState, null)).toBeNull();
    expect(loadJSON(KEYS.userProfile, null)).toBeNull();

    expect(getAccountSnapshot('1234@naver.com')).toMatchObject({
      monthlyIncome: 2000000,
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
