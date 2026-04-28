function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getRemainingDaysIncludingToday(date = new Date()) {
  const current = new Date(date);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const diff = endOfMonth.getDate() - current.getDate() + 1;
  return diff > 0 ? diff : 1;
}

export function calculateDailyBudget({
  monthlyIncome = 0,
  manualDailyBudget = '',
  carryOver = '',
  targetSavings = '',
  emergencyFund = '',
  fixedExpenses = '',
  spent = '',
  remainingDays = 1,
} = {}) {
  const manualBudget = toNumber(manualDailyBudget);
  if (manualBudget > 0) {
    return manualBudget;
  }

  const safeRemainingDays = remainingDays > 0 ? remainingDays : 1;
  const availableAmount =
    toNumber(monthlyIncome) +
    toNumber(carryOver) -
    toNumber(targetSavings) -
    toNumber(emergencyFund) -
    toNumber(fixedExpenses) -
    toNumber(spent);

  return Math.max(0, availableAmount / safeRemainingDays);
}

export function calculateGoalSavingPlan({
  goalAmount = '',
  currentSaving = '',
  goalPeriod = '',
} = {}) {
  const totalGoal = Math.max(0, toNumber(goalAmount));
  const savedAmount = Math.max(0, toNumber(currentSaving));
  const remainingAmount = Math.max(0, totalGoal - savedAmount);
  const safePeriod = Math.max(1, toNumber(goalPeriod));
  const dailyNeed = remainingAmount / safePeriod;

  return {
    remainingAmount,
    dailyNeed,
    weeklyNeed: dailyNeed * 7,
    monthlyNeed: dailyNeed * 30,
  };
}
