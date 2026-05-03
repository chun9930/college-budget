import { GENERAL_EXPENSE_CATEGORIES, RECURRING_EXPENSE_CATEGORIES } from './categories';

function makeExpenseRecord({ id, date, amount, category, paymentMethod = '카드', type = '일반', memo = '' }) {
  return {
    id,
    date,
    amount: String(amount),
    category,
    paymentMethod,
    type,
    memo,
  };
}

function makeRecurringExpense({
  id,
  name,
  amount,
  paymentDay,
  category,
  paymentMethod = '카드',
  memo = '',
}) {
  return {
    id,
    name,
    amount: String(amount),
    paymentDay: String(paymentDay),
    category,
    paymentMethod,
    memo,
  };
}

const firstAccount = {
  name: '테스트사용자',
  email: '1234@naver.com',
  password: '1234',
  monthlyIncome: 2000000,
  budgetSettings: {
    useManualBudget: false,
    manualDailyBudget: '30000',
    manualDailyBudgetEnabled: true,
    fixedExpenseAmount: '0',
    emergencyFundAmount: '0',
    goalEnabled: true,
    periodCalculationEnabled: true,
    carryOverEnabled: true,
    carryOverAmount: '100000',
    manualCarryOverEnabled: false,
    manualCarryOverAmount: '0',
  },
  savingGoalSettings: {
    goalAmount: '2000000',
    goalPeriod: '222',
    currentSaving: '0',
  },
  savingGoals: [
    {
      id: 'seed-goal-01',
      name: '제주도 여행 자금',
      category: '여행',
      targetAmount: '1000000',
      currentAmount: '250000',
      deadline: '2026-08-31',
    },
    {
      id: 'seed-goal-02',
      name: '노트북 구매',
      category: '전자기기',
      targetAmount: '1500000',
      currentAmount: '600000',
      deadline: '2026-10-15',
    },
    {
      id: 'seed-goal-03',
      name: '비상금',
      category: '비상금',
      targetAmount: '2000000',
      currentAmount: '800000',
      deadline: '2026-12-31',
    },
  ],
  recurringExpenses: [
    makeRecurringExpense({
      id: 'seed-recurring-01',
      name: '넷플릭스',
      amount: 12000,
      paymentDay: 15,
      category: RECURRING_EXPENSE_CATEGORIES[3],
      paymentMethod: '카드',
    }),
    makeRecurringExpense({
      id: 'seed-recurring-02',
      name: '유튜브 프리미엄',
      amount: 10450,
      paymentDay: 5,
      category: RECURRING_EXPENSE_CATEGORIES[3],
      paymentMethod: '카드',
    }),
    makeRecurringExpense({
      id: 'seed-recurring-03',
      name: '휴대폰요금',
      amount: 59000,
      paymentDay: 10,
      category: RECURRING_EXPENSE_CATEGORIES[1],
      paymentMethod: '카드',
    }),
    makeRecurringExpense({
      id: 'seed-recurring-04',
      name: '인터넷요금',
      amount: 33000,
      paymentDay: 8,
      category: RECURRING_EXPENSE_CATEGORIES[1],
      paymentMethod: '이체',
    }),
    makeRecurringExpense({
      id: 'seed-recurring-05',
      name: '청약저축',
      amount: 20000,
      paymentDay: 10,
      category: RECURRING_EXPENSE_CATEGORIES[4],
      paymentMethod: '이체',
    }),
    makeRecurringExpense({
      id: 'seed-recurring-06',
      name: '보험료',
      amount: 45000,
      paymentDay: 7,
      category: RECURRING_EXPENSE_CATEGORIES[2],
      paymentMethod: '카드',
    }),
  ],
  expenseRecords: [
    makeExpenseRecord({
      id: 'seed-expense-01',
      date: '2026-04-23T09:00:00',
      amount: 2000,
      category: GENERAL_EXPENSE_CATEGORIES[0],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-02',
      date: '2026-04-23T13:00:00',
      amount: 12000,
      category: GENERAL_EXPENSE_CATEGORIES[0],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-03',
      date: '2026-04-24T08:30:00',
      amount: 1500,
      category: GENERAL_EXPENSE_CATEGORIES[3],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-04',
      date: '2026-04-25T12:00:00',
      amount: 4800,
      category: GENERAL_EXPENSE_CATEGORIES[1],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-05',
      date: '2026-04-26T19:00:00',
      amount: 15000,
      category: GENERAL_EXPENSE_CATEGORIES[5],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-06',
      date: '2026-04-28T09:00:00',
      amount: 20000,
      category: GENERAL_EXPENSE_CATEGORIES[0],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-07',
      date: '2026-04-29T08:10:00',
      amount: 4800,
      category: GENERAL_EXPENSE_CATEGORIES[2],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-08',
      date: '2026-04-29T12:10:00',
      amount: 1111,
      category: GENERAL_EXPENSE_CATEGORIES[1],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'seed-expense-09',
      date: '2026-04-29T18:00:00',
      amount: 2222,
      category: GENERAL_EXPENSE_CATEGORIES[9],
      paymentMethod: '카드',
    }),
  ],
};

const secondAccount = {
  name: '대학생테스트',
  email: 'student@pingo.com',
  password: '12345',
  monthlyIncome: 800000,
  budgetSettings: {
    useManualBudget: false,
    manualDailyBudget: '20000',
    manualDailyBudgetEnabled: true,
    fixedExpenseAmount: '0',
    emergencyFundAmount: '50000',
    goalEnabled: true,
    periodCalculationEnabled: true,
    carryOverEnabled: false,
    carryOverAmount: '0',
    manualCarryOverEnabled: false,
    manualCarryOverAmount: '0',
  },
  savingGoalSettings: {
    goalAmount: '500000',
    goalPeriod: '90',
    currentSaving: '100000',
  },
  savingGoals: [
    {
      id: 'student-goal-01',
      name: '자격증 응시료',
      category: '자격증',
      targetAmount: '200000',
      currentAmount: '50000',
      deadline: '2026-06-30',
    },
  ],
  recurringExpenses: [],
  expenseRecords: [
    makeExpenseRecord({
      id: 'student-expense-01',
      date: '2026-04-27T10:00:00',
      amount: 3500,
      category: GENERAL_EXPENSE_CATEGORIES[0],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'student-expense-02',
      date: '2026-04-28T17:30:00',
      amount: 1200,
      category: GENERAL_EXPENSE_CATEGORIES[3],
      paymentMethod: '카드',
    }),
    makeExpenseRecord({
      id: 'student-expense-03',
      date: '2026-04-29T12:40:00',
      amount: 15000,
      category: GENERAL_EXPENSE_CATEGORIES[5],
      paymentMethod: '카드',
    }),
  ],
};

export const SEED_ACCOUNTS = [firstAccount, secondAccount];

export function buildSeedUsers() {
  return SEED_ACCOUNTS.map(({ name, email, password }) => ({
    name,
    email,
    password,
  }));
}

export function buildSeedAccountData() {
  return SEED_ACCOUNTS.reduce((accumulator, account) => {
    accumulator[account.email] = {
      monthlyIncome: account.monthlyIncome,
      budgetSettings: account.budgetSettings,
      savingGoalSettings: account.savingGoalSettings,
      savingGoals: account.savingGoals || [],
      expenseRecords: account.expenseRecords,
      recurringExpenses: account.recurringExpenses,
    };

    return accumulator;
  }, {});
}

export function getPrimarySeedAccount() {
  return firstAccount;
}
