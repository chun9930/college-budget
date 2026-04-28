import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllStorage, loadJSON, KEYS } from './storage';
import { login, logout, signup, getCurrentUser } from './auth';

describe('mock auth', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('saves a new user and blocks duplicate emails', () => {
    const first = signup({
      name: '홍길동',
      email: 'hong@example.com',
      password: '1234',
      passwordConfirm: '1234',
    });

    const duplicate = signup({
      name: '다른 이름',
      email: 'hong@example.com',
      password: '1234',
      passwordConfirm: '1234',
    });

    expect(first.ok).toBe(true);
    expect(duplicate.ok).toBe(false);
    expect(loadJSON(KEYS.users, [])).toHaveLength(1);
  });

  it('logs in and stores session data', () => {
    signup({
      name: '홍길동',
      email: 'hong@example.com',
      password: '1234',
      passwordConfirm: '1234',
    });

    const result = login({ email: 'hong@example.com', password: '1234' });

    expect(result.ok).toBe(true);
    expect(getCurrentUser()).toMatchObject({
      name: '홍길동',
      email: 'hong@example.com',
    });
  });

  it('logs out and clears session data', () => {
    signup({
      name: '홍길동',
      email: 'hong@example.com',
      password: '1234',
      passwordConfirm: '1234',
    });
    login({ email: 'hong@example.com', password: '1234' });

    const result = logout();

    expect(result.ok).toBe(true);
    expect(getCurrentUser()).toBeNull();
  });
});
