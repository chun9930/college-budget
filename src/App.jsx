import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Toast from './components/Toast';
import BudgetSettings from './pages/BudgetSettings';
import Calendar from './pages/Calendar';
import ExpenseRecords from './pages/ExpenseRecords';
import Home from './pages/Home';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Signup from './pages/Signup';
import Statistics from './pages/Statistics';
import { getAlertState, getHomeJudgmentSnapshot } from './lib/alert';
import { calculateDailyBudget, calculateGoalSavingPlan, getRemainingDaysIncludingToday } from './lib/budget';
import { login, logout, signup } from './lib/auth';
import { applyRecurringExpenses } from './lib/recurring';
import {
  KEYS,
  clearServiceStorage,
  loadAccountSnapshot,
  loadJSON,
  saveAccountSnapshot,
  saveJSON,
  seedMockDataIfNeeded,
} from './lib/storage';

const DEFAULT_BUDGET_SETTINGS = {
  useManualBudget: false,
  manualDailyBudget: '',
  fixedExpenseAmount: '',
  emergencyFundAmount: '',
  goalEnabled: true,
  periodCalculationEnabled: true,
  carryOverEnabled: true,
  carryOverAmount: '',
};

const DEFAULT_SAVING_GOAL_SETTINGS = {
  goalAmount: '',
  goalPeriod: '',
  currentSaving: '',
};

const DEFAULT_ALERT_STATE = {
  dismissed: false,
  lastState: 'safe',
};

const today = new Date();

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getDateKey(date = new Date()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
    current.getDate()
  ).padStart(2, '0')}`;
}

function buildDateTimeFromDateKey(dateKey) {
  return `${dateKey}T00:00:00`;
}

function createExpenseRecord(record) {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    amount: '',
    category: '식비',
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    ...record,
  };
}

function emptyGoalPlan() {
  return {
    remainingAmount: 0,
    dailyNeed: 0,
    weeklyNeed: 0,
    monthlyNeed: 0,
  };
}

function createEmptyAccountSnapshot() {
  return {
    monthlyIncome: 0,
    budgetSettings: DEFAULT_BUDGET_SETTINGS,
    savingGoalSettings: DEFAULT_SAVING_GOAL_SETTINGS,
    expenseRecords: [],
    recurringExpenses: [],
    alertState: DEFAULT_ALERT_STATE,
    alertHistory: [],
  };
}

function normalizeAccountSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return createEmptyAccountSnapshot();
  }

  return {
    monthlyIncome: snapshot.monthlyIncome ?? 0,
    budgetSettings: snapshot.budgetSettings ?? DEFAULT_BUDGET_SETTINGS,
    savingGoalSettings: snapshot.savingGoalSettings ?? DEFAULT_SAVING_GOAL_SETTINGS,
    expenseRecords: Array.isArray(snapshot.expenseRecords) ? snapshot.expenseRecords : [],
    recurringExpenses: Array.isArray(snapshot.recurringExpenses) ? snapshot.recurringExpenses : [],
    alertState: snapshot.alertState ?? DEFAULT_ALERT_STATE,
    alertHistory: Array.isArray(snapshot.alertHistory) ? snapshot.alertHistory : [],
  };
}

function loadAccountStateByEmail(email) {
  const snapshot = email ? loadAccountSnapshot(email) : null;
  if (snapshot) {
    return normalizeAccountSnapshot(snapshot);
  }

  return normalizeAccountSnapshot({
    monthlyIncome: loadJSON(KEYS.monthlyIncome, 0),
    budgetSettings: loadJSON(KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS),
    savingGoalSettings: loadJSON(KEYS.savingGoalSettings, DEFAULT_SAVING_GOAL_SETTINGS),
    expenseRecords: loadJSON(KEYS.expenseRecords, []),
    recurringExpenses: loadJSON(KEYS.recurringExpenses, []),
    alertState: loadJSON(KEYS.alertState, DEFAULT_ALERT_STATE),
    alertHistory: loadJSON(KEYS.alertHistory, []),
  });
}

function loadSeededServiceValue(email, key, fallback) {
  if (email) {
    const snapshot = loadAccountSnapshot(email);
    if (snapshot && Object.prototype.hasOwnProperty.call(snapshot, key)) {
      return snapshot[key];
    }
  }

  return loadJSON(key, fallback);
}

function RequireAuth({ isAuthed, children }) {
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSeededRef = useRef(false);
  const initialLoginState = loadJSON(KEYS.loginState, null);
  const initialUserProfile = loadJSON(KEYS.userProfile, null);
  const initialAccountEmail =
    initialLoginState?.isLoggedIn && initialUserProfile?.email ? initialUserProfile.email : '';
  const [monthlyIncome, setMonthlyIncome] = useState(() =>
    loadSeededServiceValue(initialAccountEmail, KEYS.monthlyIncome, 0)
  );
  const [budgetSettings, setBudgetSettings] = useState(() =>
    loadSeededServiceValue(initialAccountEmail, KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS)
  );
  const [savingGoalSettings, setSavingGoalSettings] = useState(() =>
    loadSeededServiceValue(
      initialAccountEmail,
      KEYS.savingGoalSettings,
      DEFAULT_SAVING_GOAL_SETTINGS
    )
  );
  const [expenseRecords, setExpenseRecords] = useState(() =>
    loadSeededServiceValue(initialAccountEmail, KEYS.expenseRecords, [])
  );
  const [recurringExpenses, setRecurringExpenses] = useState(() =>
    loadSeededServiceValue(initialAccountEmail, KEYS.recurringExpenses, [])
  );
  const [expenseDraftDateKey, setExpenseDraftDateKey] = useState(() => getDateKey(today));
  const [alertStateState, setAlertStateState] = useState(() =>
    loadJSON(KEYS.alertState, DEFAULT_ALERT_STATE)
  );
  const [alertHistory, setAlertHistory] = useState(() => loadJSON(KEYS.alertHistory, []));
  const [loginState, setLoginState] = useState(() => initialLoginState);
  const [userProfile, setUserProfile] = useState(() => initialUserProfile);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (hasSeededRef.current) {
      return;
    }

    hasSeededRef.current = true;
    seedMockDataIfNeeded();
  }, []);

  useEffect(() => {
    saveJSON(KEYS.monthlyIncome, monthlyIncome);
  }, [monthlyIncome]);

  useEffect(() => {
    saveJSON(KEYS.budgetSettings, budgetSettings);
  }, [budgetSettings]);

  useEffect(() => {
    saveJSON(KEYS.savingGoalSettings, savingGoalSettings);
  }, [savingGoalSettings]);

  useEffect(() => {
    saveJSON(KEYS.expenseRecords, expenseRecords);
  }, [expenseRecords]);

  useEffect(() => {
    saveJSON(KEYS.recurringExpenses, recurringExpenses);
  }, [recurringExpenses]);

  useEffect(() => {
    saveJSON(KEYS.alertState, alertStateState);
  }, [alertStateState]);

  useEffect(() => {
    saveJSON(KEYS.alertHistory, alertHistory);
  }, [alertHistory]);

  useEffect(() => {
    saveJSON(KEYS.loginState, loginState);
  }, [loginState]);

  useEffect(() => {
    saveJSON(KEYS.userProfile, userProfile);
  }, [userProfile]);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    setExpenseRecords((current) => {
      const next = applyRecurringExpenses(current, recurringExpenses, today);
      return next.length === current.length ? current : next;
    });
  }, [recurringExpenses]);

  const currentUser = useMemo(() => {
    if (!loginState?.isLoggedIn || !userProfile) {
      return null;
    }

    return {
      ...userProfile,
      ...loginState,
    };
  }, [loginState, userProfile]);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const snapshot = loadAccountStateByEmail(currentUser.email);

    setMonthlyIncome(snapshot.monthlyIncome);
    setBudgetSettings(snapshot.budgetSettings);
    setSavingGoalSettings(snapshot.savingGoalSettings);
    setExpenseRecords(snapshot.expenseRecords);
    setRecurringExpenses(snapshot.recurringExpenses);
    setAlertStateState(snapshot.alertState);
    setAlertHistory(snapshot.alertHistory);
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    saveAccountSnapshot(
      currentUser.email,
      normalizeAccountSnapshot({
        monthlyIncome,
        budgetSettings,
        savingGoalSettings,
        expenseRecords,
        recurringExpenses,
        alertState: alertStateState,
        alertHistory,
      })
    );
  }, [
    alertHistory,
    alertStateState,
    budgetSettings,
    currentUser?.email,
    expenseRecords,
    monthlyIncome,
    recurringExpenses,
    savingGoalSettings,
  ]);

  const isAuthed = Boolean(currentUser);
  const showChrome = isAuthed && !['/login', '/signup'].includes(location.pathname);

  const remainingDays = getRemainingDaysIncludingToday(today);

  const recurringMonthlyTotal = useMemo(
    () => recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [recurringExpenses]
  );

  const fixedExpenseTotal = toNumber(budgetSettings.fixedExpenseAmount) + recurringMonthlyTotal;

  const goalPlan = useMemo(() => {
    if (!budgetSettings.goalEnabled) {
      return emptyGoalPlan();
    }

    return calculateGoalSavingPlan(savingGoalSettings);
  }, [budgetSettings.goalEnabled, savingGoalSettings]);

  const monthSpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => isSameMonth(new Date(record.date), today))
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [expenseRecords]
  );

  const todaySpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => isSameDay(new Date(record.date), today))
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [expenseRecords]
  );

  const dailyBudget = useMemo(
    () =>
      calculateDailyBudget({
        monthlyIncome,
        manualDailyBudget: budgetSettings.useManualBudget ? budgetSettings.manualDailyBudget : '',
        carryOver: budgetSettings.carryOverEnabled ? budgetSettings.carryOverAmount : '',
        targetSavings: budgetSettings.goalEnabled ? goalPlan.remainingAmount : '',
        emergencyFund: budgetSettings.emergencyFundAmount,
        fixedExpenses: fixedExpenseTotal,
        spent: monthSpent,
        remainingDays,
      }),
    [
      budgetSettings.carryOverAmount,
      budgetSettings.carryOverEnabled,
      budgetSettings.emergencyFundAmount,
      budgetSettings.fixedExpenseAmount,
      budgetSettings.goalEnabled,
      budgetSettings.manualDailyBudget,
      budgetSettings.useManualBudget,
      fixedExpenseTotal,
      goalPlan.remainingAmount,
      monthSpent,
      monthlyIncome,
      remainingDays,
    ]
  );

  const alertState = useMemo(
    () => getAlertState({ spent: todaySpent, dailyBudget }),
    [dailyBudget, todaySpent]
  );

  const hasBudgetSetup =
    toNumber(monthlyIncome) > 0 ||
    budgetSettings.useManualBudget ||
    toNumber(budgetSettings.manualDailyBudget) > 0 ||
    toNumber(budgetSettings.fixedExpenseAmount) > 0 ||
    toNumber(budgetSettings.emergencyFundAmount) > 0 ||
    toNumber(budgetSettings.carryOverAmount) > 0 ||
    toNumber(savingGoalSettings.goalAmount) > 0 ||
    toNumber(savingGoalSettings.goalPeriod) > 0 ||
    toNumber(savingGoalSettings.currentSaving) > 0;

  const homeJudgmentSnapshot = useMemo(
    () =>
      getHomeJudgmentSnapshot({
        hasBudgetSetup,
        alertState,
        dailyBudget,
        todaySpent,
      }),
    [alertState, dailyBudget, hasBudgetSetup, todaySpent]
  );

  useEffect(() => {
    setAlertStateState((current) =>
      current.lastState === alertState.key
        ? current
        : { dismissed: false, lastState: alertState.key }
    );
  }, [alertState.key]);

  useEffect(() => {
    if (!homeJudgmentSnapshot.message) {
      return;
    }

    setAlertHistory((current) => {
      const latest = current[0];
      if (
        latest &&
        latest.statusKey === homeJudgmentSnapshot.statusKey &&
        latest.message === homeJudgmentSnapshot.message
      ) {
        return current;
      }

      return [
        {
          id: crypto.randomUUID(),
          statusKey: homeJudgmentSnapshot.statusKey,
          statusLabel: homeJudgmentSnapshot.statusLabel,
          message: homeJudgmentSnapshot.message,
          relatedAmount: homeJudgmentSnapshot.relatedAmount,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...current,
      ].slice(0, 20);
    });
  }, [homeJudgmentSnapshot]);

  const handleLogin = (formState) => {
    const result = login(formState);
    if (result.ok) {
      setLoginState(loadJSON(KEYS.loginState, null));
      setUserProfile(loadJSON(KEYS.userProfile, null));

      const snapshot = normalizeAccountSnapshot(
        loadAccountStateByEmail(String(result.user?.email || formState.email || '').trim().toLowerCase())
      );

      setMonthlyIncome(snapshot.monthlyIncome);
      setBudgetSettings(snapshot.budgetSettings);
      setSavingGoalSettings(snapshot.savingGoalSettings);
      setExpenseRecords(snapshot.expenseRecords);
      setRecurringExpenses(snapshot.recurringExpenses);
      setAlertStateState(snapshot.alertState);
      setAlertHistory(snapshot.alertHistory);
    }

    return result;
  };

  const handleSignup = (formState) => signup(formState);

  const handleLogout = () => {
    logout();
    setLoginState(null);
    setUserProfile(null);
    navigate('/login', { replace: true });
  };

  const handleResetData = () => {
    clearServiceStorage();
    setMonthlyIncome(0);
    setBudgetSettings(DEFAULT_BUDGET_SETTINGS);
    setSavingGoalSettings(DEFAULT_SAVING_GOAL_SETTINGS);
    setExpenseRecords([]);
    setRecurringExpenses([]);
    setExpenseDraftDateKey(getDateKey(today));
    setAlertStateState(DEFAULT_ALERT_STATE);
    setAlertHistory([]);
  };

  const addExpenseRecord = (record) => {
    const nextRecord = {
      ...record,
      date: record.date || buildDateTimeFromDateKey(expenseDraftDateKey),
    };

    setExpenseRecords((current) => [createExpenseRecord(nextRecord), ...current]);
    setAlertStateState((current) => ({ ...current, dismissed: false }));
  };

  const updateExpenseRecord = (expenseId, nextRecord) => {
    setExpenseRecords((current) =>
      current.map((item) => (item.id === expenseId ? { ...item, ...nextRecord, id: item.id } : item))
    );
  };

  const deleteExpenseRecord = (expenseId) => {
    setExpenseRecords((current) => current.filter((item) => item.id !== expenseId));
  };

  const addRecurringExpense = (record) => {
    setRecurringExpenses((current) => [
      {
        id: crypto.randomUUID(),
        ...record,
      },
      ...current,
    ]);
  };

  const updateRecurringExpense = (recurringId, nextRecord) => {
    setRecurringExpenses((current) =>
      current.map((item) => (item.id === recurringId ? { ...item, ...nextRecord } : item))
    );
  };

  const deleteRecurringExpense = (recurringId) => {
    setRecurringExpenses((current) => current.filter((item) => item.id !== recurringId));
  };

  const updateBudgetSettings = ({ monthlyIncome: nextMonthlyIncome, budgetSettings: nextBudgetSettings, savingGoalSettings: nextSavingGoalSettings }) => {
    setMonthlyIncome(toNumber(nextMonthlyIncome));
    setBudgetSettings(nextBudgetSettings);
    setSavingGoalSettings(nextSavingGoalSettings);
  };

  const updateBudgetSettingsField = (field, value) => {
    setBudgetSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const dismissAlert = () => {
    setAlertStateState((current) => ({ ...current, dismissed: true }));
  };

  const clearAlertHistory = () => {
    setAlertHistory([]);
  };

  const markAlertHistoryRead = () => {
    setAlertHistory((current) => current.map((item) => (item.read ? item : { ...item, read: true })));
  };

  const showToast = (message, tone = 'success') => {
    if (!message) {
      return;
    }

    setToast({
      id: crypto.randomUUID(),
      message,
      tone,
    });

    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const sharedProps = {
    currentUser,
    dailyBudget,
    todaySpent,
    alertState,
    alertDismissed: alertStateState.dismissed,
    alertHistory,
    fixedExpenseTotal,
    remainingDays,
    hasBudgetSetup,
  };

  return (
    <div className="app-shell">
      {showChrome ? <Header currentUser={currentUser} onLogout={handleLogout} /> : null}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Home
                  {...sharedProps}
                  onDismissAlert={dismissAlert}
                  onClearAlertHistory={clearAlertHistory}
                  onMarkAlertHistoryRead={markAlertHistoryRead}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/budget-settings"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <BudgetSettings
                  monthlyIncome={monthlyIncome}
                  budgetSettings={budgetSettings}
                  savingGoalSettings={savingGoalSettings}
                  recurringExpenses={recurringExpenses}
                  dailyBudget={dailyBudget}
                  remainingDays={remainingDays}
                  onSave={updateBudgetSettings}
                  onToggleChange={updateBudgetSettingsField}
                  showToast={showToast}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/expense-records"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <ExpenseRecords
                  expenseRecords={expenseRecords}
                  recurringExpenses={recurringExpenses}
                  selectedDateKey={expenseDraftDateKey}
                  dailyBudget={dailyBudget}
                  todaySpent={todaySpent}
                  onAddExpenseRecord={addExpenseRecord}
                  onUpdateExpenseRecord={updateExpenseRecord}
                  onDeleteExpenseRecord={deleteExpenseRecord}
                  onAddRecurringExpense={addRecurringExpense}
                  onUpdateRecurringExpense={updateRecurringExpense}
                  onDeleteRecurringExpense={deleteRecurringExpense}
                  showToast={showToast}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Calendar expenseRecords={expenseRecords} onSelectDate={setExpenseDraftDateKey} />
              </RequireAuth>
            }
          />
          <Route
            path="/statistics"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Statistics expenseRecords={expenseRecords} recurringExpenses={recurringExpenses} />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={<Login currentUser={currentUser} onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={<Signup currentUser={currentUser} onSignup={handleSignup} />}
          />
          <Route
            path="/my-page"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <MyPage
                  currentUser={currentUser}
                  budgetSettings={budgetSettings}
                  savingGoalSettings={savingGoalSettings}
                  onLogout={handleLogout}
                  onResetData={handleResetData}
                />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to={isAuthed ? '/' : '/login'} replace />} />
        </Routes>
      </main>
      {showChrome ? <BottomNav /> : null}
    </div>
  );
}
