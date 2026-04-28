export const KEYS = {
  monthlyIncome: 'monthlyIncome',
  budgetAmount: 'budgetAmount',
  budgetSettings: 'budgetSettings',
  alertState: 'alertState',
  expenseRecords: 'expenseRecords',
  expenseTemplates: 'expenseTemplates',
  recurringExpenses: 'recurringExpenses',
  loginState: 'loginState',
};

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

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeJSON(key) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}
