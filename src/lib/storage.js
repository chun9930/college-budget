export const KEYS = {
  monthlyIncome: 'monthlyIncome',
  budgetSettings: 'budgetSettings',
  savingGoalSettings: 'savingGoalSettings',
  alertState: 'alertState',
  expenseRecords: 'expenseRecords',
  recurringExpenses: 'recurringExpenses',
  loginState: 'loginState',
  userProfile: 'userProfile',
  users: 'users',
};

const ALL_KEYS = Object.values(KEYS);

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
