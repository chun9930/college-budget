import { KEYS, loadJSON, removeJSON, saveJSON } from './storage';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function loadUsers() {
  return loadJSON(KEYS.users, []);
}

function saveUsers(users) {
  saveJSON(KEYS.users, users);
}

export function getCurrentUser() {
  const loginState = loadJSON(KEYS.loginState, null);
  const userProfile = loadJSON(KEYS.userProfile, null);

  if (!loginState || !userProfile) {
    return null;
  }

  return {
    ...userProfile,
    ...loginState,
  };
}

export function signup({ name, email, password, passwordConfirm }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    return { ok: false, error: '필수 항목을 모두 입력해 주세요.' };
  }

  if (normalizedPassword !== String(passwordConfirm || '')) {
    return { ok: false, error: '비밀번호 확인이 일치하지 않습니다.' };
  }

  const users = loadUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { ok: false, error: '이미 가입된 이메일입니다.' };
  }

  const user = {
    id: crypto.randomUUID(),
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
    createdAt: new Date().toISOString(),
  };

  saveUsers([user, ...users]);

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');
  const users = loadUsers();
  const user = users.find(
    (item) => item.email === normalizedEmail && item.password === normalizedPassword
  );

  if (!user) {
    return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }

  const session = {
    userId: user.id,
    email: user.email,
    isLoggedIn: true,
    loggedInAt: new Date().toISOString(),
  };
  const profile = {
    userId: user.id,
    name: user.name,
    email: user.email,
  };

  saveJSON(KEYS.loginState, session);
  saveJSON(KEYS.userProfile, profile);

  return { ok: true, user: profile };
}

export function logout() {
  removeJSON(KEYS.loginState);
  removeJSON(KEYS.userProfile);
  return { ok: true };
}

