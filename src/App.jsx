import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import BudgetSettings from './pages/BudgetSettings';
import ExpenseRecords from './pages/ExpenseRecords';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import { getAlertState } from './lib/alert';
import { calculateDailyBudget, getRemainingDaysIncludingToday } from './lib/budget';
import { applyRecurringExpenses } from './lib/recurring';
import { KEYS, loadJSON, saveJSON } from './lib/storage';

const DEFAULT_BUDGET_SETTINGS = {
  useManualBudget: false,
  manualDailyBudget: '',
  carryOverEnabled: false,
  carryOverAmount: '',
  targetSavings: '',
  emergencyFund: '',
  fixedExpenseAmount: '',
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
    category: '식비',
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    ...record,
  };
}

export default function App() {
  const [monthlyIncome, setMonthlyIncome] = useState(() => loadJSON(KEYS.monthlyIncome, 0));
  const [budgetSettings, setBudgetSettings] = useState(() =>
    loadJSON(KEYS.budgetSettings, DEFAULT_BUDGET_SETTINGS)
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

  useEffect(() => {
    saveJSON(KEYS.monthlyIncome, monthlyIncome);
  }, [monthlyIncome]);

  useEffect(() => {
    saveJSON(KEYS.budgetSettings, budgetSettings);
  }, [budgetSettings]);

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
    setExpenseRecords((current) => {
      const next = applyRecurringExpenses(current, recurringExpenses, today);
      return next.length === current.length ? current : next;
    });
  }, [recurringExpenses]);

  const remainingDays = getRemainingDaysIncludingToday(today);

  const recurringMonthlyTotal = useMemo(
    () => recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0),
    [recurringExpenses]
  );

  const fixedExpenseTotal = toNumber(budgetSettings.fixedExpenseAmount) + recurringMonthlyTotal;

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
        targetSavings: budgetSettings.targetSavings,
        emergencyFund: budgetSettings.emergencyFund,
        fixedExpenses: fixedExpenseTotal,
        spent: monthSpent,
        remainingDays,
      }),
    [
      budgetSettings.carryOverAmount,
      budgetSettings.carryOverEnabled,
      budgetSettings.emergencyFund,
      budgetSettings.fixedExpenseAmount,
      budgetSettings.manualDailyBudget,
      budgetSettings.targetSavings,
      budgetSettings.useManualBudget,
      fixedExpenseTotal,
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

  const updateBudgetSettings = (nextSettings) => {
    setMonthlyIncome(toNumber(nextSettings.monthlyIncome));
    setBudgetSettings(nextSettings.budgetSettings);
  };

  const dismissAlert = () => {
    setAlertStateState((current) => ({ ...current, dismissed: true }));
  };

  const sharedProps = {
    dailyBudget,
    todaySpent,
    alertState,
    alertDismissed: alertStateState.dismissed,
    fixedExpenseTotal,
    remainingDays,
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={<Home {...sharedProps} onDismissAlert={dismissAlert} />}
          />
          <Route
            path="/budget-settings"
            element={
              <BudgetSettings
                monthlyIncome={monthlyIncome}
                budgetSettings={budgetSettings}
                dailyBudget={dailyBudget}
                remainingDays={remainingDays}
                onSave={updateBudgetSettings}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
