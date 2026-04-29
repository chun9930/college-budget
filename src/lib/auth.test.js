import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllStorage, loadJSON, KEYS } from './storage';
import { EMAIL_REGEX, getCurrentUser, login, logout, signup } from './auth';

describe('mock auth', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('validates email format with the shared regex', () => {
    expect(EMAIL_REGEX.test('test@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('1234')).toBe(false);
  });

  it('saves a new user and blocks duplicate emails', () => {
    const first = signup({
      name: '홍길동',
      email: 'hong@example.com',
      password: '1234',
      passwordConfirm: '1234',
    });

    const duplicate = signup({
      name: '둘리',
      email: 'hong@example.com',
      password: '1234',
      passwordConfirm: '1234',
    });

    expect(first.ok).toBe(true);
    expect(duplicate.ok).toBe(false);
    expect(loadJSON(KEYS.users, [])).toEqual([
      {
        name: '홍길동',
        email: 'hong@example.com',
        password: '1234',
      },
    ]);
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

  it('rejects invalid email before checking credentials', () => {
    const result = login({ email: '1234', password: '1234' });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('올바른 이메일 형식으로 입력해주세요.');
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
