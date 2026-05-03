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
import { getAlertState, getHomeJudgmentSnapshot, getMonthlyJudgmentSnapshot } from './lib/alert';
import {
  calculateAutomaticCarryOver,
  calculateDailyBudget,
  calculateGoalSavingPlan,
  getToday,
  getRemainingDaysIncludingToday,
} from './lib/budget';
import { login, logout, signup } from './lib/auth';
import { applyRecurringExpenses } from './lib/recurring';
import {
  KEYS,
  clearServiceStorage,
  loadJSON,
  loadNormalizedServiceState,
  saveAccountSnapshot,
  saveJSON,
  seedMockDataIfNeeded,
} from './lib/storage';

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

const DEFAULT_SAVING_GOALS = [];

const DEFAULT_ALERT_STATE = {
  dismissed: false,
  lastState: 'safe',
};

const DEFAULT_CARRY_OVER_STATE = {
  lastCalculatedMonth: '',
  monthlySnapshots: {},
};

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

function isSamePreviousMonth(left, right) {
  const previousMonth = new Date(right.getFullYear(), right.getMonth() - 1, 1);
  return (
    left.getFullYear() === previousMonth.getFullYear() &&
    left.getMonth() === previousMonth.getMonth()
  );
}

function getMonthKey(date = new Date()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
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
  const initialAccountState = loadNormalizedServiceState(initialAccountEmail);
  const [monthlyIncome, setMonthlyIncome] = useState(() => initialAccountState.monthlyIncome);
  const [budgetSettings, setBudgetSettings] = useState(() => initialAccountState.budgetSettings);
  const [savingGoalSettings, setSavingGoalSettings] = useState(
    () => initialAccountState.savingGoalSettings
  );
  const [savingGoals, setSavingGoals] = useState(() => initialAccountState.savingGoals);
  const [expenseRecords, setExpenseRecords] = useState(() => initialAccountState.expenseRecords);
  const [recurringExpenses, setRecurringExpenses] = useState(
    () => initialAccountState.recurringExpenses
  );
  const [carryOverState, setCarryOverState] = useState(() => initialAccountState.carryOverState);
  const [currentDate, setCurrentDate] = useState(() => getToday());
  const [expenseDraftDateKey, setExpenseDraftDateKey] = useState(() => getDateKey(currentDate));
  const [alertStateState, setAlertStateState] = useState(() => initialAccountState.alertState);
  const [alertHistory, setAlertHistory] = useState(() => initialAccountState.alertHistory);
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
    saveJSON(KEYS.savingGoals, savingGoals);
  }, [savingGoals]);

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

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentDate((current) => {
        const next = getToday();
        return getDateKey(current) === getDateKey(next) ? current : next;
      });
    }, 60000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    setExpenseRecords((current) => {
      const next = applyRecurringExpenses(current, recurringExpenses, currentDate);
      return next.length === current.length ? current : next;
    });
  }, [currentDate, recurringExpenses]);

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

    const snapshot = loadNormalizedServiceState(currentUser.email);

    setMonthlyIncome(snapshot.monthlyIncome);
    setBudgetSettings(snapshot.budgetSettings);
    setSavingGoalSettings(snapshot.savingGoalSettings);
    setSavingGoals(snapshot.savingGoals ?? DEFAULT_SAVING_GOALS);
    setExpenseRecords(snapshot.expenseRecords);
    setRecurringExpenses(snapshot.recurringExpenses);
    setAlertStateState(snapshot.alertState);
    setAlertHistory(snapshot.alertHistory);
    setCarryOverState(snapshot.carryOverState ?? DEFAULT_CARRY_OVER_STATE);
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    saveAccountSnapshot(currentUser.email, {
      monthlyIncome,
      budgetSettings,
      savingGoalSettings,
      savingGoals,
      expenseRecords,
      recurringExpenses,
      alertState: alertStateState,
      alertHistory,
      carryOverState,
    });
  }, [
    alertHistory,
    alertStateState,
    budgetSettings,
    currentUser?.email,
    expenseRecords,
    monthlyIncome,
    recurringExpenses,
    savingGoalSettings,
    savingGoals,
    carryOverState,
  ]);

  const isAuthed = Boolean(currentUser);
  const showChrome = isAuthed && !['/login', '/signup'].includes(location.pathname);

  const remainingDays = getRemainingDaysIncludingToday(currentDate);
  const currentMonthKey = getMonthKey(currentDate);

  const recurringTotal = useMemo(
    () =>
      recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [recurringExpenses]
  );

  const manualFixedExpenseAmount = toNumber(budgetSettings.fixedExpenseAmount);
  const totalFixedExpense =
    manualFixedExpenseAmount +
    (budgetSettings.autoIncludeRecurringExpenses ? recurringTotal : 0);

  const goalPlan = useMemo(() => {
    if (!budgetSettings.goalEnabled) {
      return emptyGoalPlan();
    }

    return calculateGoalSavingPlan(savingGoalSettings);
  }, [budgetSettings.goalEnabled, savingGoalSettings]);

  const displayMonthSpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => isSameMonth(new Date(record.date), currentDate))
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [currentDate, expenseRecords]
  );

  const budgetMonthSpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => isSameMonth(new Date(record.date), currentDate))
        .filter(
          (record) =>
            !(
              budgetSettings.autoIncludeRecurringExpenses &&
              record.sourceRecurringId
            )
        )
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [budgetSettings.autoIncludeRecurringExpenses, currentDate, expenseRecords]
  );

  const previousMonthSpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => isSamePreviousMonth(new Date(record.date), currentDate))
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [currentDate, expenseRecords]
  );

  const autoCarryOverSnapshot = carryOverState.monthlySnapshots?.[currentMonthKey];
  const calculatedAutomaticCarryOverAmount = useMemo(
    () =>
      calculateAutomaticCarryOver({
        monthlyIncome,
        targetSavings: budgetSettings.goalEnabled ? goalPlan.remainingAmount : '',
        emergencyFund: budgetSettings.emergencyFundAmount,
        fixedExpenses: totalFixedExpense,
        spent: previousMonthSpent,
      }),
    [
      budgetSettings.emergencyFundAmount,
      budgetSettings.goalEnabled,
      goalPlan.remainingAmount,
      monthlyIncome,
      previousMonthSpent,
      totalFixedExpense,
    ]
  );

  const todaySpent = useMemo(
    () =>
      expenseRecords
        .filter((record) => isSameDay(new Date(record.date), currentDate))
        .reduce((sum, record) => sum + toNumber(record.amount), 0),
    [currentDate, expenseRecords]
  );

  const automaticCarryOverAmount =
    autoCarryOverSnapshot && Number.isFinite(Number(autoCarryOverSnapshot.automaticCarryOverAmount))
      ? Number(autoCarryOverSnapshot.automaticCarryOverAmount)
      : calculatedAutomaticCarryOverAmount;

  const effectiveCarryOverAmount =
    budgetSettings.carryOverEnabled
      ? budgetSettings.manualCarryOverEnabled
        ? budgetSettings.manualCarryOverAmount
        : automaticCarryOverAmount
      : '';

  const dailyBudget = useMemo(
    () =>
      calculateDailyBudget({
        monthlyIncome,
        manualDailyBudget: budgetSettings.useManualBudget ? budgetSettings.manualDailyBudget : '',
        carryOver: effectiveCarryOverAmount,
        targetSavings: budgetSettings.goalEnabled ? goalPlan.remainingAmount : '',
        emergencyFund: budgetSettings.emergencyFundAmount,
        fixedExpenses: totalFixedExpense,
        spent: budgetMonthSpent,
        remainingDays,
      }),
    [
      budgetSettings.carryOverEnabled,
      budgetSettings.emergencyFundAmount,
      budgetSettings.fixedExpenseAmount,
      budgetSettings.goalEnabled,
      budgetSettings.autoIncludeRecurringExpenses,
      budgetSettings.manualCarryOverAmount,
      budgetSettings.manualCarryOverEnabled,
      budgetSettings.manualDailyBudget,
      budgetSettings.useManualBudget,
      effectiveCarryOverAmount,
      totalFixedExpense,
      goalPlan.remainingAmount,
      budgetMonthSpent,
      monthlyIncome,
      remainingDays,
      recurringTotal,
    ]
  );

  const monthlyBudgetBase = useMemo(
    () =>
      Math.max(
        0,
        toNumber(monthlyIncome) +
          toNumber(effectiveCarryOverAmount) -
          (budgetSettings.goalEnabled ? goalPlan.remainingAmount : 0) -
          toNumber(budgetSettings.emergencyFundAmount) -
          totalFixedExpense
      ),
    [
      budgetSettings.emergencyFundAmount,
      budgetSettings.goalEnabled,
      effectiveCarryOverAmount,
      goalPlan.remainingAmount,
      monthlyIncome,
      totalFixedExpense,
    ]
  );

  const alertState = useMemo(
    () => getAlertState({ spent: todaySpent, dailyBudget }),
    [dailyBudget, todaySpent]
  );

  const hasBudgetSetup =
    toNumber(monthlyIncome) > 0 ||
    (budgetSettings.useManualBudget && toNumber(budgetSettings.manualDailyBudget) > 0);

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

  const monthlyJudgmentSnapshot = useMemo(
    () =>
      getMonthlyJudgmentSnapshot({
        hasBudgetSetup,
        monthlyBudget: monthlyBudgetBase,
        monthSpent: budgetMonthSpent,
      }),
    [budgetMonthSpent, hasBudgetSetup, monthlyBudgetBase]
  );

  useEffect(() => {
    if (!currentUser?.email || !budgetSettings.carryOverEnabled || budgetSettings.manualCarryOverEnabled) {
      return;
    }

    setCarryOverState((current) => {
      const currentSnapshots =
        current.monthlySnapshots && typeof current.monthlySnapshots === 'object'
          ? current.monthlySnapshots
          : {};
      const existingSnapshot = currentSnapshots[currentMonthKey];
      const nextSnapshot = {
        automaticCarryOverAmount: calculatedAutomaticCarryOverAmount,
        calculatedAt: new Date().toISOString(),
      };

      if (
        current.lastCalculatedMonth === currentMonthKey &&
        existingSnapshot &&
        Number(existingSnapshot.automaticCarryOverAmount || 0) === calculatedAutomaticCarryOverAmount
      ) {
        return current;
      }

      return {
        lastCalculatedMonth: currentMonthKey,
        monthlySnapshots: {
          ...currentSnapshots,
          [currentMonthKey]: nextSnapshot,
        },
      };
    });
  }, [
    calculatedAutomaticCarryOverAmount,
    budgetSettings.carryOverEnabled,
    budgetSettings.manualCarryOverEnabled,
    currentMonthKey,
    currentUser?.email,
  ]);

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

  useEffect(() => {
    if (!currentUser?.email || !budgetSettings.carryOverEnabled || budgetSettings.manualCarryOverEnabled) {
      return;
    }

    setCarryOverState((current) => {
      const currentSnapshots =
        current.monthlySnapshots && typeof current.monthlySnapshots === 'object'
          ? current.monthlySnapshots
          : {};
      const existingSnapshot = currentSnapshots[currentMonthKey];
      const nextSnapshot = {
        automaticCarryOverAmount: calculatedAutomaticCarryOverAmount,
        calculatedAt: new Date().toISOString(),
      };

      if (
        current.lastCalculatedMonth === currentMonthKey &&
        existingSnapshot &&
        Number(existingSnapshot.automaticCarryOverAmount || 0) === calculatedAutomaticCarryOverAmount
      ) {
        return current;
      }

      return {
        lastCalculatedMonth: currentMonthKey,
        monthlySnapshots: {
          ...currentSnapshots,
          [currentMonthKey]: nextSnapshot,
        },
      };
    });
  }, [
    calculatedAutomaticCarryOverAmount,
    budgetSettings.carryOverEnabled,
    budgetSettings.manualCarryOverEnabled,
    currentMonthKey,
    currentUser?.email,
  ]);

  const handleLogin = (formState) => {
    const result = login(formState);
    if (result.ok) {
      setLoginState(loadJSON(KEYS.loginState, null));
      setUserProfile(loadJSON(KEYS.userProfile, null));

      const snapshot = loadNormalizedServiceState(
        String(result.user?.email || formState.email || '').trim().toLowerCase()
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
    setSavingGoals(DEFAULT_SAVING_GOALS);
    setExpenseRecords([]);
    setRecurringExpenses([]);
    setCarryOverState(DEFAULT_CARRY_OVER_STATE);
    setExpenseDraftDateKey(getDateKey(currentDate));
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

  const updateSavingGoals = (nextSavingGoals) => {
    setSavingGoals(Array.isArray(nextSavingGoals) ? nextSavingGoals : []);
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
    currentDate,
    alertState,
    alertDismissed: alertStateState.dismissed,
    alertHistory,
    fixedExpenseTotal: totalFixedExpense,
    totalFixedExpense,
    manualFixedExpenseAmount,
    recurringTotal,
    displayMonthSpent,
    budgetMonthSpent,
    remainingDays,
    hasBudgetSetup,
    monthlyJudgmentSnapshot,
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
                  savingGoals={savingGoals}
                  recurringExpenses={recurringExpenses}
                  currentDate={currentDate}
                  dailyBudget={dailyBudget}
                  remainingDays={remainingDays}
                  totalFixedExpense={totalFixedExpense}
                  automaticCarryOverAmount={automaticCarryOverAmount}
                  monthlyJudgmentSnapshot={monthlyJudgmentSnapshot}
                  onSave={updateBudgetSettings}
                  onSavingGoalsChange={updateSavingGoals}
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
                  currentDate={currentDate}
                  selectedDateKey={expenseDraftDateKey}
                  dailyBudget={dailyBudget}
                  todaySpent={todaySpent}
                  hasBudgetSetup={hasBudgetSetup}
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
                <Calendar
                  expenseRecords={expenseRecords}
                  currentDate={currentDate}
                  onSelectDate={setExpenseDraftDateKey}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/statistics"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <Statistics
                  expenseRecords={expenseRecords}
                  recurringExpenses={recurringExpenses}
                  currentDate={currentDate}
                />
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
