import { buildSeedAccountData, buildSeedUsers, getPrimarySeedAccount } from './seedData';

export const KEYS = {
  monthlyIncome: 'monthlyIncome',
  budgetSettings: 'budgetSettings',
  savingGoalSettings: 'savingGoalSettings',
  alertState: 'alertState',
  alertHistory: 'alertHistory',
  expenseRecords: 'expenseRecords',
  recurringExpenses: 'recurringExpenses',
  loginState: 'loginState',
  userProfile: 'userProfile',
  users: 'users',
  mockAccountData: 'mockAccountData',
};

const ALL_KEYS = Object.values(KEYS);
const SERVICE_KEYS = [
  KEYS.monthlyIncome,
  KEYS.budgetSettings,
  KEYS.savingGoalSettings,
  KEYS.alertState,
  KEYS.alertHistory,
  KEYS.expenseRecords,
  KEYS.recurringExpenses,
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function mergeSeedUsers(existingUsers) {
  const users = Array.isArray(existingUsers) ? existingUsers.map((user) => ({
    name: String(user?.name || '').trim(),
    email: normalizeEmail(user?.email),
    password: String(user?.password || ''),
  })) : [];
  const nextUsers = new Map(users.filter((user) => user.email).map((user) => [user.email, user]));

  buildSeedUsers().forEach((user) => {
    const normalizedEmail = normalizeEmail(user.email);
    if (!normalizedEmail || nextUsers.has(normalizedEmail)) {
      return;
    }

    nextUsers.set(normalizedEmail, {
      name: String(user.name || '').trim(),
      email: normalizedEmail,
      password: String(user.password || ''),
    });
  });

  return Array.from(nextUsers.values());
}

function mergeSeedAccountData(existingAccountData) {
  const nextAccountData =
    existingAccountData && typeof existingAccountData === 'object' ? { ...existingAccountData } : {};
  const seedAccountData = buildSeedAccountData();

  Object.entries(seedAccountData).forEach(([email, snapshot]) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || nextAccountData[normalizedEmail]) {
      return;
    }

    nextAccountData[normalizedEmail] = snapshot;
  });

  return nextAccountData;
}

export function loadJSON(key, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  const rawValue = window.localStorage.getItem(key);
  if (rawValue === null) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

export function saveJSON(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeJSON(key) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

export function clearAllStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  ALL_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export function loadAccountSnapshot(email) {
  const accountData = loadJSON(KEYS.mockAccountData, {});
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !accountData || typeof accountData !== 'object') {
    return null;
  }

  return accountData[normalizedEmail] || null;
}

export const getAccountSnapshot = loadAccountSnapshot;

export function saveAccountSnapshot(email, snapshot) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const accountData = loadJSON(KEYS.mockAccountData, {});
  const nextAccountData = accountData && typeof accountData === 'object' ? { ...accountData } : {};

  if (snapshot === null || snapshot === undefined) {
    delete nextAccountData[normalizedEmail];
  } else {
    nextAccountData[normalizedEmail] = snapshot;
  }

  saveJSON(KEYS.mockAccountData, nextAccountData);
}

export function seedMockDataIfNeeded() {
  if (typeof window === 'undefined') {
    return false;
  }

  const primaryAccount = getPrimarySeedAccount();
  let didSeedAnything = false;
  const existingUsers = loadJSON(KEYS.users, []);
  const nextUsers = mergeSeedUsers(existingUsers);
  const usersChanged = JSON.stringify(nextUsers) !== JSON.stringify(existingUsers);

  if (usersChanged || window.localStorage.getItem(KEYS.users) === null) {
    saveJSON(KEYS.users, nextUsers);
    didSeedAnything = true;
  }

  const existingAccountData = loadJSON(KEYS.mockAccountData, {});
  const nextAccountData = mergeSeedAccountData(existingAccountData);
  const accountDataChanged =
    JSON.stringify(nextAccountData) !== JSON.stringify(existingAccountData);

  if (accountDataChanged || window.localStorage.getItem(KEYS.mockAccountData) === null) {
    saveJSON(KEYS.mockAccountData, nextAccountData);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.monthlyIncome) === null) {
    saveJSON(KEYS.monthlyIncome, primaryAccount.monthlyIncome);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.budgetSettings) === null) {
    saveJSON(KEYS.budgetSettings, primaryAccount.budgetSettings);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.savingGoalSettings) === null) {
    saveJSON(KEYS.savingGoalSettings, primaryAccount.savingGoalSettings);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.expenseRecords) === null) {
    saveJSON(KEYS.expenseRecords, primaryAccount.expenseRecords);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.recurringExpenses) === null) {
    saveJSON(KEYS.recurringExpenses, primaryAccount.recurringExpenses);
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.alertState) === null) {
    saveJSON(KEYS.alertState, {
      dismissed: false,
      lastState: 'safe',
    });
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.alertHistory) === null) {
    saveJSON(KEYS.alertHistory, []);
    didSeedAnything = true;
  }

  return didSeedAnything;
}

export function clearServiceStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  SERVICE_KEYS.forEach((key) => window.localStorage.removeItem(key));

  const loginState = loadJSON(KEYS.loginState, null);
  const userProfile = loadJSON(KEYS.userProfile, null);
  const email = normalizeEmail(userProfile?.email || loginState?.email || '');

  if (email) {
    const accountData = loadJSON(KEYS.mockAccountData, {});
    if (accountData && typeof accountData === 'object' && accountData[email]) {
      const nextAccountData = { ...accountData };
      delete nextAccountData[email];
      saveJSON(KEYS.mockAccountData, nextAccountData);
    }
  }
}
