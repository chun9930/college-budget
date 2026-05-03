import { buildSeedAccountData, buildSeedUsers, getPrimarySeedAccount } from './seedData';

export const KEYS = {
  monthlyIncome: 'monthlyIncome',
  budgetSettings: 'budgetSettings',
  savingGoalSettings: 'savingGoalSettings',
  savingGoals: 'savingGoals',
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
  KEYS.savingGoals,
  KEYS.alertState,
  KEYS.alertHistory,
  KEYS.expenseRecords,
  KEYS.recurringExpenses,
];

const DEFAULT_BUDGET_SETTINGS = {
  incomeMode: 'direct',
  hourlyWage: '',
  workHoursPerDay: '',
  workDaysPerWeek: '',
  useManualBudget: false,
  manualDailyBudget: '',
  fixedExpenseAmount: '',
  autoIncludeRecurringExpenses: false,
  emergencyFundAmount: '',
  goalEnabled: true,
  periodCalculationEnabled: true,
  carryOverEnabled: true,
  carryOverAmount: '',
  manualCarryOverEnabled: false,
  manualCarryOverAmount: '',
};

const DEFAULT_SAVING_GOAL_SETTINGS = {
  goalAmount: '',
  goalPeriod: '',
  currentSaving: '',
};

const DEFAULT_CARRY_OVER_STATE = {
  lastCalculatedMonth: '',
  monthlySnapshots: {},
};

const DEFAULT_ALERT_STATE = {
  dismissed: false,
  lastState: 'safe',
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function toString(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value, fallback = false) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }

    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return Boolean(value);
}

function toObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function createFallbackId(prefix, index) {
  return `${prefix}-${index}`;
}

export function normalizeStoredBudgetSettings(value) {
  const source = toObject(value);

  return {
    ...DEFAULT_BUDGET_SETTINGS,
    ...source,
    incomeMode: toString(source.incomeMode || DEFAULT_BUDGET_SETTINGS.incomeMode, 'direct') || 'direct',
    hourlyWage: toString(source.hourlyWage ?? DEFAULT_BUDGET_SETTINGS.hourlyWage),
    workHoursPerDay: toString(source.workHoursPerDay ?? DEFAULT_BUDGET_SETTINGS.workHoursPerDay),
    workDaysPerWeek: toString(source.workDaysPerWeek ?? DEFAULT_BUDGET_SETTINGS.workDaysPerWeek),
    useManualBudget: toBoolean(source.useManualBudget, DEFAULT_BUDGET_SETTINGS.useManualBudget),
    manualDailyBudget: toString(source.manualDailyBudget ?? DEFAULT_BUDGET_SETTINGS.manualDailyBudget),
    fixedExpenseAmount: toString(source.fixedExpenseAmount ?? DEFAULT_BUDGET_SETTINGS.fixedExpenseAmount),
    autoIncludeRecurringExpenses: toBoolean(
      source.autoIncludeRecurringExpenses,
      DEFAULT_BUDGET_SETTINGS.autoIncludeRecurringExpenses
    ),
    emergencyFundAmount: toString(
      source.emergencyFundAmount ?? DEFAULT_BUDGET_SETTINGS.emergencyFundAmount
    ),
    goalEnabled: toBoolean(source.goalEnabled, DEFAULT_BUDGET_SETTINGS.goalEnabled),
    periodCalculationEnabled: toBoolean(
      source.periodCalculationEnabled,
      DEFAULT_BUDGET_SETTINGS.periodCalculationEnabled
    ),
    carryOverEnabled: toBoolean(source.carryOverEnabled, DEFAULT_BUDGET_SETTINGS.carryOverEnabled),
    carryOverAmount: toString(source.carryOverAmount ?? DEFAULT_BUDGET_SETTINGS.carryOverAmount),
    manualCarryOverEnabled: toBoolean(
      source.manualCarryOverEnabled,
      DEFAULT_BUDGET_SETTINGS.manualCarryOverEnabled
    ),
    manualCarryOverAmount: toString(
      source.manualCarryOverAmount ?? DEFAULT_BUDGET_SETTINGS.manualCarryOverAmount
    ),
  };
}

function normalizeSavingGoalSettings(value) {
  const source = toObject(value);

  return {
    ...DEFAULT_SAVING_GOAL_SETTINGS,
    goalAmount: toString(source.goalAmount ?? DEFAULT_SAVING_GOAL_SETTINGS.goalAmount),
    goalPeriod: toString(source.goalPeriod ?? DEFAULT_SAVING_GOAL_SETTINGS.goalPeriod),
    currentSaving: toString(source.currentSaving ?? DEFAULT_SAVING_GOAL_SETTINGS.currentSaving),
  };
}

export function normalizeStoredCarryOverState(value) {
  const source = toObject(value);
  const monthlySnapshots = toObject(source.monthlySnapshots);

  return {
    lastCalculatedMonth: toString(
      source.lastCalculatedMonth ?? DEFAULT_CARRY_OVER_STATE.lastCalculatedMonth
    ),
    monthlySnapshots: { ...monthlySnapshots },
  };
}

function normalizeAlertState(value) {
  const source = toObject(value);

  return {
    ...DEFAULT_ALERT_STATE,
    ...source,
    dismissed: toBoolean(source.dismissed, DEFAULT_ALERT_STATE.dismissed),
    lastState: toString(source.lastState ?? DEFAULT_ALERT_STATE.lastState, 'safe') || 'safe',
  };
}

function normalizeSavingGoals(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((goal, index) => {
    const source = toObject(goal);

    return {
      id: toString(source.id || createFallbackId('saving-goal', index)),
      name: toString(source.name),
      category: toString(source.category),
      targetAmount: toString(source.targetAmount),
      currentAmount: toString(source.currentAmount),
      deadline: toString(source.deadline),
    };
  });
}

function normalizeExpenseRecords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((record, index) => {
    const source = toObject(record);
    const nextRecord = {
      id: toString(source.id || createFallbackId('expense-record', index)),
      date: toString(source.date),
      amount: toString(source.amount),
      category: toString(source.category),
      paymentMethod: toString(source.paymentMethod),
      type: toString(source.type),
      memo: toString(source.memo),
    };

    if (source.sourceRecurringId) {
      nextRecord.sourceRecurringId = toString(source.sourceRecurringId);
    }

    return nextRecord;
  });
}

function normalizeRecurringExpenses(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((record, index) => {
    const source = toObject(record);

    return {
      id: toString(source.id || createFallbackId('recurring-expense', index)),
      name: toString(source.name),
      amount: toString(source.amount),
      paymentDay: toString(source.paymentDay),
      category: toString(source.category),
      paymentMethod: toString(source.paymentMethod),
      memo: toString(source.memo),
    };
  });
}

function normalizeAlertHistoryItem(item, index) {
  const source = toObject(item);

  return {
    id: toString(source.id || createFallbackId('alert-history', index)),
    statusKey: toString(source.statusKey || 'safe', 'safe') || 'safe',
    statusLabel: toString(source.statusLabel || '안전'),
    message: toString(source.message),
    relatedAmount: toNumber(source.relatedAmount),
    createdAt: toString(source.createdAt || new Date().toISOString()),
    read: toBoolean(source.read, false),
  };
}

export function normalizeNotificationHistory(alertHistoryValue, notificationHistoryValue) {
  const merged = [];
  const seen = new Set();
  const sources = [alertHistoryValue, notificationHistoryValue];

  sources.forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item, index) => {
      const normalized = normalizeAlertHistoryItem(item, index);
      const signature =
        normalized.id ||
        [
          normalized.statusKey,
          normalized.message,
          normalized.relatedAmount,
          normalized.createdAt,
        ].join('|');

      if (seen.has(signature)) {
        return;
      }

      seen.add(signature);
      merged.push(normalized);
    });
  });

  return merged;
}

export function normalizeStoredAccountSnapshot(snapshot) {
  const source = toObject(snapshot);
  const { notificationHistory, ...rest } = source;

  return {
    monthlyIncome: toNumber(rest.monthlyIncome),
    budgetSettings: normalizeStoredBudgetSettings(rest.budgetSettings),
    savingGoalSettings: normalizeSavingGoalSettings(rest.savingGoalSettings),
    savingGoals: normalizeSavingGoals(rest.savingGoals),
    expenseRecords: normalizeExpenseRecords(rest.expenseRecords),
    recurringExpenses: normalizeRecurringExpenses(rest.recurringExpenses),
    alertState: normalizeAlertState(rest.alertState),
    alertHistory: normalizeNotificationHistory(rest.alertHistory, notificationHistory),
    carryOverState: normalizeStoredCarryOverState(rest.carryOverState),
  };
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

    nextAccountData[normalizedEmail] = normalizeStoredAccountSnapshot(snapshot);
  });

  return nextAccountData;
}

export function loadNormalizedServiceState(email) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    const accountSnapshot = loadAccountSnapshot(normalizedEmail);
    if (accountSnapshot) {
      return accountSnapshot;
    }
  }

  return normalizeStoredAccountSnapshot({
    monthlyIncome: loadJSON(KEYS.monthlyIncome, 0),
    budgetSettings: loadJSON(KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS),
    savingGoalSettings: loadJSON(KEYS.savingGoalSettings, DEFAULT_SAVING_GOAL_SETTINGS),
    savingGoals: loadJSON(KEYS.savingGoals, []),
    expenseRecords: loadJSON(KEYS.expenseRecords, []),
    recurringExpenses: loadJSON(KEYS.recurringExpenses, []),
    alertState: loadJSON(KEYS.alertState, DEFAULT_ALERT_STATE),
    alertHistory: loadJSON(KEYS.alertHistory, []),
    notificationHistory: loadJSON('notificationHistory', []),
    carryOverState: loadJSON('carryOverState', DEFAULT_CARRY_OVER_STATE),
  });
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

  const snapshot = accountData[normalizedEmail];
  return snapshot ? normalizeStoredAccountSnapshot(snapshot) : null;
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
    nextAccountData[normalizedEmail] = normalizeStoredAccountSnapshot(snapshot);
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
    saveJSON(KEYS.budgetSettings, normalizeStoredBudgetSettings(primaryAccount.budgetSettings));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.savingGoalSettings) === null) {
    saveJSON(
      KEYS.savingGoalSettings,
      normalizeSavingGoalSettings(primaryAccount.savingGoalSettings)
    );
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.savingGoals) === null) {
    saveJSON(KEYS.savingGoals, normalizeSavingGoals(primaryAccount.savingGoals || []));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.expenseRecords) === null) {
    saveJSON(KEYS.expenseRecords, normalizeExpenseRecords(primaryAccount.expenseRecords));
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.recurringExpenses) === null) {
    saveJSON(
      KEYS.recurringExpenses,
      normalizeRecurringExpenses(primaryAccount.recurringExpenses)
    );
    didSeedAnything = true;
  }

  if (window.localStorage.getItem(KEYS.alertState) === null) {
    saveJSON(KEYS.alertState, normalizeAlertState(DEFAULT_ALERT_STATE));
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
