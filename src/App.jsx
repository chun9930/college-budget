import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import BudgetSettings from './pages/BudgetSettings';
import ExpenseRecords from './pages/ExpenseRecords';
import Home from './pages/Home';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import Signup from './pages/Signup';
import Statistics from './pages/Statistics';
import { getAlertState } from './lib/alert';
import { calculateDailyBudget, calculateGoalSavingPlan, getRemainingDaysIncludingToday } from './lib/budget';
import { login, logout, signup } from './lib/auth';
import { applyRecurringExpenses } from './lib/recurring';
import { KEYS, clearAllStorage, loadJSON, saveJSON } from './lib/storage';

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

export default function App() {
  const [monthlyIncome, setMonthlyIncome] = useState(() => loadJSON(KEYS.monthlyIncome, 0));
  const [budgetSettings, setBudgetSettings] = useState(() =>
    loadJSON(KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS)
  );
  const [savingGoalSettings, setSavingGoalSettings] = useState(() =>
    loadJSON(KEYS.savingGoalSettings, DEFAULT_SAVING_GOAL_SETTINGS)
  );
  const [expenseRecords, setExpenseRecords] = useState(() => loadJSON(KEYS.expenseRecords, []));
  const [expenseTemplates, setExpenseTemplates] = useState(() =>
    loadJSON(KEYS.expenseTemplates, [])
  );
  const [recurringExpenses, setRecurringExpenses] = useState(() =>
    loadJSON(KEYS.recurringExpenses, [])
  );
  const [alertStateState, setAlertStateState] = useState(() =>
    loadJSON(KEYS.alertState, DEFAULT_ALERT_STATE)
  );
  const [loginState, setLoginState] = useState(() => loadJSON(KEYS.loginState, null));
  const [userProfile, setUserProfile] = useState(() => loadJSON(KEYS.userProfile, null));

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
    saveJSON(KEYS.expenseTemplates, expenseTemplates);
  }, [expenseTemplates]);

  useEffect(() => {
    saveJSON(KEYS.recurringExpenses, recurringExpenses);
  }, [recurringExpenses]);

  useEffect(() => {
    saveJSON(KEYS.alertState, alertStateState);
  }, [alertStateState]);

  useEffect(() => {
    saveJSON(KEYS.loginState, loginState);
  }, [loginState]);

  useEffect(() => {
    saveJSON(KEYS.userProfile, userProfile);
  }, [userProfile]);

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

  useEffect(() => {
    setAlertStateState((current) =>
      current.lastState === alertState.key
        ? current
        : { dismissed: false, lastState: alertState.key }
    );
  }, [alertState.key]);

  const handleLogin = (formState) => {
    const result = login(formState);
    if (result.ok) {
      setLoginState(loadJSON(KEYS.loginState, null));
      setUserProfile(loadJSON(KEYS.userProfile, null));
    }

    return result;
  };

  const handleSignup = (formState) => signup(formState);

  const handleLogout = () => {
    logout();
    setLoginState(null);
    setUserProfile(null);
  };

  const handleResetData = () => {
    clearAllStorage();
    setMonthlyIncome(0);
    setBudgetSettings(DEFAULT_BUDGET_SETTINGS);
    setSavingGoalSettings(DEFAULT_SAVING_GOAL_SETTINGS);
    setExpenseRecords([]);
    setExpenseTemplates([]);
    setRecurringExpenses([]);
    setAlertStateState(DEFAULT_ALERT_STATE);
    setLoginState(null);
    setUserProfile(null);
  };

  const addExpenseRecord = (record) => {
    setExpenseRecords((current) => [createExpenseRecord(record), ...current]);
    setAlertStateState((current) => ({ ...current, dismissed: false }));
  };

  const addExpenseTemplate = (template) => {
    setExpenseTemplates((current) => [template, ...current]);
  };

  const removeExpenseTemplate = (templateId) => {
    setExpenseTemplates((current) => current.filter((template) => template.id !== templateId));
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

  const sharedProps = {
    currentUser,
    dailyBudget,
    todaySpent,
    alertState,
    alertDismissed: alertStateState.dismissed,
    fixedExpenseTotal,
    remainingDays,
  };

  return (
    <div className="app-shell">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home {...sharedProps} onDismissAlert={dismissAlert} />} />
          <Route
            path="/budget-settings"
            element={
              <BudgetSettings
                monthlyIncome={monthlyIncome}
                budgetSettings={budgetSettings}
                savingGoalSettings={savingGoalSettings}
                dailyBudget={dailyBudget}
                remainingDays={remainingDays}
                onSave={updateBudgetSettings}
                onToggleChange={updateBudgetSettingsField}
              />
            }
          />
          <Route
            path="/expense-records"
            element={
              <ExpenseRecords
                expenseRecords={expenseRecords}
                expenseTemplates={expenseTemplates}
                recurringExpenses={recurringExpenses}
                onAddExpenseRecord={addExpenseRecord}
                onAddExpenseTemplate={addExpenseTemplate}
                onRemoveExpenseTemplate={removeExpenseTemplate}
                onAddRecurringExpense={addRecurringExpense}
              />
            }
          />
          <Route
            path="/statistics"
            element={<Statistics expenseRecords={expenseRecords} recurringExpenses={recurringExpenses} />}
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
              <MyPage
                currentUser={currentUser}
                budgetSettings={budgetSettings}
                savingGoalSettings={savingGoalSettings}
                onLogout={handleLogout}
                onResetData={handleResetData}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
