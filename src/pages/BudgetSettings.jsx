import React, { useEffect, useMemo, useState } from 'react';
import FormField from '../components/FormField';
import MetricStrip from '../components/MetricStrip';
import PrimaryButton from '../components/PrimaryButton';
import ToggleRow from '../components/ToggleRow';
import { calculateGoalSavingPlan, calculateSavingGoalListSummary } from '../lib/budget';

const DEFAULT_FORM = {
  incomeMode: 'direct',
  monthlyIncome: '',
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
  goalAmount: '',
  goalPeriod: '',
  currentSaving: '',
};

const WORK_INCOME_MONTH_MULTIPLIER = 4.345;

const GOAL_CATEGORY_OPTIONS = ['여행', '노트북', '전자기기', '비상금', '학비', '자격증', '교환학생', '기타'];

const BUDGET_TABS = [
  { key: 'basic', label: '예산 계산 설정' },
  { key: 'goals', label: '목표 계획 목록' },
];

const DEFAULT_GOAL_FORM = {
  name: '',
  category: GOAL_CATEGORY_OPTIONS[0],
  targetAmount: '',
  currentAmount: '',
  deadline: '',
};

const TOGGLE_FIELDS = [
  { key: 'useManualBudget', label: '수동 예산 사용' },
  { key: 'goalEnabled', label: '목표 설정' },
  { key: 'periodCalculationEnabled', label: '기간별 저축 계산' },
  { key: 'carryOverEnabled', label: '이월 기능' },
];

function toDisplayNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : '0';
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyGoalPlan() {
  return {
    remainingAmount: 0,
    dailyNeed: 0,
    weeklyNeed: 0,
    monthlyNeed: 0,
  };
}

function validateBudgetNumber(value, config) {
  const {
    enabled = true,
    allowEmpty = false,
    integer = false,
    min = 0,
    inclusive = true,
    emptyMessage = '값을 입력해주세요.',
    minMessage = '숫자를 확인해주세요.',
    integerMessage = '정수로 입력해주세요.',
  } = config;

  if (!enabled) {
    return { isValid: true, message: '', normalizedValue: String(value ?? '') };
  }

  const text = String(value ?? '').trim();

  if (!text) {
    return allowEmpty
      ? { isValid: true, message: '', normalizedValue: '' }
      : { isValid: false, message: emptyMessage, normalizedValue: '' };
  }

  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return { isValid: false, message: '숫자만 입력해주세요.', normalizedValue: text };
  }

  const numericValue = Number(text);

  if (!Number.isFinite(numericValue)) {
    return { isValid: false, message: '숫자만 입력해주세요.', normalizedValue: text };
  }

  if (integer && !Number.isInteger(numericValue)) {
    return { isValid: false, message: integerMessage, normalizedValue: text };
  }

  const invalid = inclusive ? numericValue < min : numericValue <= min;

  if (invalid) {
    return { isValid: false, message: minMessage, normalizedValue: text };
  }

  return { isValid: true, message: '', normalizedValue: text };
}

function buildValidationMap(formState) {
  return {
    monthlyIncome: validateBudgetNumber(formState.monthlyIncome, {
      enabled: formState.incomeMode !== 'work',
      allowEmpty: true,
      emptyMessage: '월수입을 입력해주세요.',
      minMessage: '월수입은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    hourlyWage: validateBudgetNumber(formState.hourlyWage, {
      enabled: formState.incomeMode === 'work',
      allowEmpty: true,
      emptyMessage: '시급을 입력해주세요.',
      minMessage: '시급은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    workHoursPerDay: validateBudgetNumber(formState.workHoursPerDay, {
      enabled: formState.incomeMode === 'work',
      allowEmpty: true,
      emptyMessage: '하루 근무시간을 입력해주세요.',
      minMessage: '하루 근무시간은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    workDaysPerWeek: validateBudgetNumber(formState.workDaysPerWeek, {
      enabled: formState.incomeMode === 'work',
      allowEmpty: true,
      emptyMessage: '주 근무일수를 입력해주세요.',
      minMessage: '주 근무일수는 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    manualDailyBudget: validateBudgetNumber(formState.manualDailyBudget, {
      enabled: formState.useManualBudget,
      allowEmpty: true,
      emptyMessage: '수동 하루 예산을 입력해주세요.',
      minMessage: '수동 하루 예산은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    fixedExpenseAmount: validateBudgetNumber(formState.fixedExpenseAmount, {
      allowEmpty: true,
      emptyMessage: '수동 고정지출 금액을 입력해주세요.',
      minMessage: '수동 고정지출은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    emergencyFundAmount: validateBudgetNumber(formState.emergencyFundAmount, {
      allowEmpty: true,
      emptyMessage: '비상금 금액을 입력해주세요.',
      minMessage: '비상금은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    manualCarryOverAmount: validateBudgetNumber(formState.manualCarryOverAmount, {
      enabled: formState.carryOverEnabled && formState.manualCarryOverEnabled,
      allowEmpty: true,
      emptyMessage: '수동 이월 금액을 입력해주세요.',
      minMessage: '이월 금액은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    goalAmount: validateBudgetNumber(formState.goalAmount, {
      enabled: formState.goalEnabled,
      allowEmpty: true,
      emptyMessage: '목표 금액을 입력해주세요.',
      minMessage: '목표 금액은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    goalPeriod: validateBudgetNumber(formState.goalPeriod, {
      enabled: formState.goalEnabled,
      allowEmpty: true,
      integer: true,
      emptyMessage: '목표 기간을 입력해주세요.',
      minMessage: '목표 기간은 0 이상으로 입력해주세요.',
      integerMessage: '목표 기간은 정수로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    currentSaving: validateBudgetNumber(formState.currentSaving, {
      enabled: formState.goalEnabled,
      allowEmpty: true,
      emptyMessage: '현재 저축액을 입력해주세요.',
      minMessage: '현재 저축액은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
  };
}

function hasUnsavedChanges(formState, props) {
  return (
    String(formState.incomeMode ?? 'direct') !== String(props.budgetSettings.incomeMode ?? 'direct') ||
    String(formState.monthlyIncome ?? '') !== String(props.monthlyIncome ?? '') ||
    String(formState.hourlyWage ?? '') !== String(props.budgetSettings.hourlyWage ?? '') ||
    String(formState.workHoursPerDay ?? '') !== String(props.budgetSettings.workHoursPerDay ?? '') ||
    String(formState.workDaysPerWeek ?? '') !== String(props.budgetSettings.workDaysPerWeek ?? '') ||
    Boolean(formState.useManualBudget) !== Boolean(props.budgetSettings.useManualBudget) ||
    String(formState.manualDailyBudget ?? '') !== String(props.budgetSettings.manualDailyBudget ?? '') ||
    String(formState.fixedExpenseAmount ?? '') !== String(props.budgetSettings.fixedExpenseAmount ?? '') ||
    Boolean(formState.autoIncludeRecurringExpenses) !==
      Boolean(props.budgetSettings.autoIncludeRecurringExpenses) ||
    String(formState.emergencyFundAmount ?? '') !==
      String(props.budgetSettings.emergencyFundAmount ?? '') ||
    Boolean(formState.goalEnabled) !== Boolean(props.budgetSettings.goalEnabled) ||
    Boolean(formState.periodCalculationEnabled) !==
      Boolean(props.budgetSettings.periodCalculationEnabled) ||
    Boolean(formState.carryOverEnabled) !== Boolean(props.budgetSettings.carryOverEnabled) ||
    String(formState.carryOverAmount ?? '') !== String(props.budgetSettings.carryOverAmount ?? '') ||
    Boolean(formState.manualCarryOverEnabled) !==
      Boolean(props.budgetSettings.manualCarryOverEnabled) ||
    String(formState.manualCarryOverAmount ?? '') !==
      String(props.budgetSettings.manualCarryOverAmount ?? '') ||
    String(formState.goalAmount ?? '') !== String(props.savingGoalSettings.goalAmount ?? '') ||
    String(formState.goalPeriod ?? '') !== String(props.savingGoalSettings.goalPeriod ?? '') ||
    String(formState.currentSaving ?? '') !== String(props.savingGoalSettings.currentSaving ?? '')
  );
}

export default function BudgetSettings({
  monthlyIncome,
  budgetSettings,
  savingGoalSettings,
  savingGoals = [],
  recurringExpenses = [],
  dailyBudget,
  remainingDays,
  automaticCarryOverAmount = 0,
  totalFixedExpense = 0,
  monthlyJudgmentSnapshot,
  onSave,
  onSavingGoalsChange,
  showToast,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [goalFormState, setGoalFormState] = useState(DEFAULT_GOAL_FORM);
  const [editingGoalId, setEditingGoalId] = useState('');
  const [goalFormError, setGoalFormError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      incomeMode: budgetSettings.incomeMode || 'direct',
      monthlyIncome: String(monthlyIncome || ''),
      hourlyWage: String(budgetSettings.hourlyWage || ''),
      workHoursPerDay: String(budgetSettings.workHoursPerDay || ''),
      workDaysPerWeek: String(budgetSettings.workDaysPerWeek || ''),
      useManualBudget: Boolean(budgetSettings.useManualBudget),
      manualDailyBudget: String(budgetSettings.manualDailyBudget || ''),
      fixedExpenseAmount: String(budgetSettings.fixedExpenseAmount || ''),
      autoIncludeRecurringExpenses: Boolean(budgetSettings.autoIncludeRecurringExpenses),
      emergencyFundAmount: String(budgetSettings.emergencyFundAmount || ''),
      goalEnabled: Boolean(budgetSettings.goalEnabled),
      periodCalculationEnabled: Boolean(budgetSettings.periodCalculationEnabled),
      carryOverEnabled: Boolean(budgetSettings.carryOverEnabled),
      carryOverAmount: String(budgetSettings.carryOverAmount || ''),
      manualCarryOverEnabled: Boolean(budgetSettings.manualCarryOverEnabled),
      manualCarryOverAmount: String(
        budgetSettings.manualCarryOverAmount ?? budgetSettings.carryOverAmount ?? ''
      ),
      goalAmount: String(savingGoalSettings.goalAmount || ''),
      goalPeriod: String(savingGoalSettings.goalPeriod || ''),
      currentSaving: String(savingGoalSettings.currentSaving || ''),
    }));
    setSubmitAttempted(false);
  }, [
    budgetSettings.autoIncludeRecurringExpenses,
    budgetSettings.carryOverAmount,
    budgetSettings.carryOverEnabled,
    budgetSettings.emergencyFundAmount,
    budgetSettings.fixedExpenseAmount,
    budgetSettings.goalEnabled,
    budgetSettings.hourlyWage,
    budgetSettings.incomeMode,
    budgetSettings.manualCarryOverAmount,
    budgetSettings.manualCarryOverEnabled,
    budgetSettings.manualDailyBudget,
    budgetSettings.periodCalculationEnabled,
    budgetSettings.useManualBudget,
    budgetSettings.workDaysPerWeek,
    budgetSettings.workHoursPerDay,
    monthlyIncome,
    savingGoalSettings.currentSaving,
    savingGoalSettings.goalAmount,
    savingGoalSettings.goalPeriod,
  ]);

  const validationMap = useMemo(() => buildValidationMap(formState), [formState]);

  const goalPlan = useMemo(() => {
    if (!formState.goalEnabled) {
      return emptyGoalPlan();
    }

    return calculateGoalSavingPlan({
      goalAmount: formState.goalAmount,
      goalPeriod: formState.goalPeriod,
      currentSaving: formState.currentSaving,
    });
  }, [formState.currentSaving, formState.goalAmount, formState.goalEnabled, formState.goalPeriod]);

  const goalCards = useMemo(
    () => calculateSavingGoalListSummary(savingGoals),
    [savingGoals]
  );

  const recurringExpenseTotal = useMemo(
    () =>
      recurringExpenses.reduce((sum, item) => {
        const amount = Number(item.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [recurringExpenses]
  );

  const hasRecurringExpenses = recurringExpenses.length > 0;
  const manualFixedExpenseAmount = toNumber(formState.fixedExpenseAmount);
  const workIncomePreview = useMemo(
    () =>
      Math.round(
        toNumber(formState.hourlyWage) *
          toNumber(formState.workHoursPerDay) *
          toNumber(formState.workDaysPerWeek) *
          WORK_INCOME_MONTH_MULTIPLIER
      ),
    [formState.hourlyWage, formState.workDaysPerWeek, formState.workHoursPerDay]
  );
  const formDirty = useMemo(
    () =>
      hasUnsavedChanges(formState, {
        monthlyIncome,
        budgetSettings,
        savingGoalSettings,
      }),
    [budgetSettings, formState, monthlyIncome, savingGoalSettings]
  );

  const hasErrors = useMemo(
    () => Object.values(validationMap).some((item) => !item.isValid),
    [validationMap]
  );

  const shouldShowError = () => submitAttempted || formDirty;

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors) {
      return;
    }

    const normalizedMonthlyIncome = validationMap.monthlyIncome.normalizedValue || '0';
    const normalizedHourlyWage = validationMap.hourlyWage.normalizedValue || '0';
    const normalizedWorkHoursPerDay = validationMap.workHoursPerDay.normalizedValue || '0';
    const normalizedWorkDaysPerWeek = validationMap.workDaysPerWeek.normalizedValue || '0';
    const normalizedManualDailyBudget = validationMap.manualDailyBudget.normalizedValue || '0';
    const normalizedFixedExpense = validationMap.fixedExpenseAmount.normalizedValue || '0';
    const normalizedEmergencyFund = validationMap.emergencyFundAmount.normalizedValue || '0';
    const normalizedManualCarryOver = validationMap.manualCarryOverAmount.normalizedValue || '0';
    const normalizedGoalAmount = validationMap.goalAmount.normalizedValue || '0';
    const normalizedGoalPeriod = validationMap.goalPeriod.normalizedValue || '0';
    const normalizedCurrentSaving = validationMap.currentSaving.normalizedValue || '0';
    const automaticCarryOver = String(Math.max(0, Math.round(toNumber(automaticCarryOverAmount))));

    const nextIncomeMode = formState.incomeMode === 'work' ? 'work' : 'direct';
    const nextMonthlyIncome =
      nextIncomeMode === 'work' ? String(workIncomePreview) : normalizedMonthlyIncome;
    const nextUseManualBudget =
      Boolean(formState.useManualBudget) && toNumber(normalizedManualDailyBudget) > 0;
    const nextGoalEnabled =
      Boolean(formState.goalEnabled) &&
      toNumber(normalizedGoalAmount) > 0 &&
      toNumber(normalizedGoalPeriod) >= 1;
    const nextManualCarryOverEnabled =
      Boolean(formState.carryOverEnabled) &&
      Boolean(formState.manualCarryOverEnabled) &&
      toNumber(normalizedManualCarryOver) > 0;
    const nextCarryOverAmount = formState.carryOverEnabled
      ? nextManualCarryOverEnabled
        ? normalizedManualCarryOver
        : automaticCarryOver
      : '0';

    onSave({
      monthlyIncome: nextMonthlyIncome,
      budgetSettings: {
        incomeMode: nextIncomeMode,
        hourlyWage: nextIncomeMode === 'work' ? normalizedHourlyWage : '0',
        workHoursPerDay: nextIncomeMode === 'work' ? normalizedWorkHoursPerDay : '0',
        workDaysPerWeek: nextIncomeMode === 'work' ? normalizedWorkDaysPerWeek : '0',
        useManualBudget: nextUseManualBudget,
        manualDailyBudget: nextUseManualBudget ? normalizedManualDailyBudget : '0',
        fixedExpenseAmount: normalizedFixedExpense,
        autoIncludeRecurringExpenses: Boolean(formState.autoIncludeRecurringExpenses),
        emergencyFundAmount: normalizedEmergencyFund,
        goalEnabled: nextGoalEnabled,
        periodCalculationEnabled: nextGoalEnabled && formState.periodCalculationEnabled,
        carryOverEnabled: formState.carryOverEnabled,
        carryOverAmount: nextCarryOverAmount,
        manualCarryOverEnabled: nextManualCarryOverEnabled,
        manualCarryOverAmount: nextManualCarryOverEnabled ? normalizedManualCarryOver : '0',
      },
      savingGoalSettings: {
        goalAmount: nextGoalEnabled ? normalizedGoalAmount : '0',
        goalPeriod: nextGoalEnabled ? normalizedGoalPeriod : '1',
        currentSaving: nextGoalEnabled ? normalizedCurrentSaving : '0',
      },
    });
    showToast?.('예산 설정이 저장되었습니다.');
    setSubmitAttempted(false);
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateChoiceField = (field, value) => () => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetGoalForm = () => {
    setGoalFormState(DEFAULT_GOAL_FORM);
    setEditingGoalId('');
    setGoalFormError('');
  };

  const startGoalEdit = (goal) => {
    setGoalFormState({
      name: goal.name || '',
      category: goal.category || GOAL_CATEGORY_OPTIONS[0],
      targetAmount: String(goal.targetAmount ?? ''),
      currentAmount: String(goal.currentAmount ?? ''),
      deadline: String(goal.deadline ?? ''),
    });
    setEditingGoalId(goal.id);
    setGoalFormError('');
  };

  const handleGoalSubmit = (event) => {
    event.preventDefault();

    const normalizedName = String(goalFormState.name || '').trim();
    const normalizedTargetAmount = Math.max(0, toNumber(goalFormState.targetAmount));
    const normalizedCurrentAmount = Math.max(0, toNumber(goalFormState.currentAmount));
    const normalizedDeadline = String(goalFormState.deadline || '').trim();

    if (!normalizedName) {
      setGoalFormError('목표명을 입력해주세요.');
      return;
    }

    if (normalizedTargetAmount <= 0) {
      setGoalFormError('목표 금액은 0보다 큰 숫자로 입력해주세요.');
      return;
    }

    if (!normalizedDeadline) {
      setGoalFormError('마감일을 선택해주세요.');
      return;
    }

    const nextGoal = {
      id: editingGoalId || crypto.randomUUID(),
      name: normalizedName,
      category: String(goalFormState.category || GOAL_CATEGORY_OPTIONS[0]),
      targetAmount: String(normalizedTargetAmount),
      currentAmount: String(normalizedCurrentAmount),
      deadline: normalizedDeadline,
    };

    const nextGoals = editingGoalId
      ? savingGoals.map((goal) => (goal.id === editingGoalId ? nextGoal : goal))
      : [nextGoal, ...savingGoals];

    onSavingGoalsChange?.(nextGoals);
    showToast?.(editingGoalId ? '목표를 수정했습니다.' : '목표를 추가했습니다.');
    resetGoalForm();
  };

  const handleGoalDelete = (goalId) => {
    const nextGoals = savingGoals.filter((goal) => goal.id !== goalId);
    onSavingGoalsChange?.(nextGoals);

    if (editingGoalId === goalId) {
      resetGoalForm();
    }

    showToast?.('목표를 삭제했습니다.');
  };

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">예산 설정</h1>
          <p className="page-subtitle">
            월수입, 수동 고정지출, 목표 저축을 설정해 하루 예산을 확인합니다.
          </p>
        </div>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="예산 설정 탭">
        {BUDGET_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <MetricStrip
        items={[
          {
            title: "오늘 예산 미리보기",
            value: `${Math.round(dailyBudget).toLocaleString()}원`,
            note: `남은 일수 ${remainingDays}일 기준`,
          },
          {
            title: "월 수입",
            value: `${toDisplayNumber(monthlyIncome)}원`,
            note: "저장된 월 수입 기준",
          },
          {
            title: "목표 저축",
            value: `${toDisplayNumber(goalPlan.remainingAmount)}원`,
            note: "저장된 목표 설정 기준",
          },
        ]}
      />
      {monthlyJudgmentSnapshot ? (
        <div className={`alert-banner ${monthlyJudgmentSnapshot.statusKey}`}>
          <div className="alert-copy">
            <h3>이번 달 {monthlyJudgmentSnapshot.statusLabel}</h3>
            <p>{monthlyJudgmentSnapshot.message}</p>
          </div>
          <p className="muted budget-month-note">{monthlyJudgmentSnapshot.description}</p>
        </div>
      ) : null}
      {activeTab === 'basic' ? (
        <form className="budget-layout" onSubmit={handleSubmit}>
        <section className="card stack budget-main">
          <h2 className="section-title">예산 계산 설정</h2>
          <p className="muted budget-save-note">
            월수입, 월 저축 계획, 수동 고정지출, 비상금, 이월, 정기지출 자동 반영을 관리하는
            설정 탭입니다. 입력한 값은 '저장하기'를 눌러야 적용됩니다.
          </p>

          {formDirty ? (
            <p className="muted budget-save-dirty">저장되지 않은 변경사항이 있습니다.</p>
          ) : null}

          <div className="stack">
            <h3 className="section-title">수입 입력 방식</h3>
            <div className="choice-group" role="group" aria-label="수입 입력 방식">
              <button
                type="button"
                className={`choice-button ${formState.incomeMode === 'direct' ? 'is-selected' : ''}`}
                onClick={updateChoiceField('incomeMode', 'direct')}
              >
                직접 입력
              </button>
              <button
                type="button"
                className={`choice-button ${formState.incomeMode === 'work' ? 'is-selected' : ''}`}
                onClick={updateChoiceField('incomeMode', 'work')}
              >
                근무 조건 계산
              </button>
            </div>
          </div>

          <p className="muted budget-note">
            직접 입력은 입력한 월수입을 그대로 저장하고, 근무 조건 계산은 시급 × 하루 근무시간 × 주
            근무일수 × 4.345로 계산한 값을 월수입에 적용합니다.
          </p>

          {formState.incomeMode === 'work' ? (
            <div className="stack">
              <FormField id="hourlyWage" label="시급">
                <input
                  id="hourlyWage"
                  type="text"
                  inputMode="numeric"
                  value={formState.hourlyWage}
                  onChange={updateField('hourlyWage')}
                  aria-invalid={Boolean(
                    validationMap.hourlyWage.message && shouldShowError('hourlyWage')
                  )}
                  className={
                    validationMap.hourlyWage.message && shouldShowError('hourlyWage')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.hourlyWage.message && shouldShowError('hourlyWage') ? (
                  <p className="error-text">{validationMap.hourlyWage.message}</p>
                ) : null}
              </FormField>

              <FormField id="workHoursPerDay" label="하루 근무시간">
                <input
                  id="workHoursPerDay"
                  type="text"
                  inputMode="numeric"
                  value={formState.workHoursPerDay}
                  onChange={updateField('workHoursPerDay')}
                  aria-invalid={Boolean(
                    validationMap.workHoursPerDay.message && shouldShowError('workHoursPerDay')
                  )}
                  className={
                    validationMap.workHoursPerDay.message && shouldShowError('workHoursPerDay')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.workHoursPerDay.message && shouldShowError('workHoursPerDay') ? (
                  <p className="error-text">{validationMap.workHoursPerDay.message}</p>
                ) : null}
              </FormField>

              <FormField id="workDaysPerWeek" label="주 근무일수">
                <input
                  id="workDaysPerWeek"
                  type="text"
                  inputMode="numeric"
                  value={formState.workDaysPerWeek}
                  onChange={updateField('workDaysPerWeek')}
                  aria-invalid={Boolean(
                    validationMap.workDaysPerWeek.message && shouldShowError('workDaysPerWeek')
                  )}
                  className={
                    validationMap.workDaysPerWeek.message && shouldShowError('workDaysPerWeek')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.workDaysPerWeek.message && shouldShowError('workDaysPerWeek') ? (
                  <p className="error-text">{validationMap.workDaysPerWeek.message}</p>
                ) : null}
              </FormField>

              <div className="budget-inline-stat">
                <span className="muted">예상 월수입</span>
                <strong>{toDisplayNumber(workIncomePreview)}</strong>
              </div>
              <p className="muted budget-note">
                계산된 예상 월수입은 저장하면 monthlyIncome에 반영됩니다.
              </p>
            </div>
          ) : (
            <FormField id="monthlyIncome" label="월수입">
              <input
                id="monthlyIncome"
                type="text"
                inputMode="numeric"
                value={formState.monthlyIncome}
                onChange={updateField('monthlyIncome')}
                aria-invalid={Boolean(
                  validationMap.monthlyIncome.message && shouldShowError('monthlyIncome')
                )}
                className={
                  validationMap.monthlyIncome.message && shouldShowError('monthlyIncome')
                    ? 'input-error'
                    : ''
                }
              />
              {validationMap.monthlyIncome.message && shouldShowError('monthlyIncome') ? (
                <p className="error-text">{validationMap.monthlyIncome.message}</p>
              ) : null}
            </FormField>
          )}

          <FormField id="manualDailyBudget" label="수동 하루 예산">
            <input
              id="manualDailyBudget"
              type="text"
              inputMode="numeric"
              value={formState.manualDailyBudget}
              onChange={updateField('manualDailyBudget')}
              disabled={!formState.useManualBudget}
              aria-invalid={Boolean(
                validationMap.manualDailyBudget.message && shouldShowError('manualDailyBudget')
              )}
              className={
                validationMap.manualDailyBudget.message && shouldShowError('manualDailyBudget')
                  ? 'input-error'
                  : ''
              }
            />
            {validationMap.manualDailyBudget.message && shouldShowError('manualDailyBudget') ? (
              <p className="error-text">{validationMap.manualDailyBudget.message}</p>
            ) : null}
          </FormField>

          <FormField id="fixedExpenseAmount" label="수동 고정지출">
            <input
              id="fixedExpenseAmount"
              type="text"
              inputMode="numeric"
              value={formState.fixedExpenseAmount}
              onChange={updateField('fixedExpenseAmount')}
              aria-invalid={Boolean(
                validationMap.fixedExpenseAmount.message && shouldShowError('fixedExpenseAmount')
              )}
              className={
                validationMap.fixedExpenseAmount.message && shouldShowError('fixedExpenseAmount')
                  ? 'input-error'
                  : ''
              }
            />
            {validationMap.fixedExpenseAmount.message && shouldShowError('fixedExpenseAmount') ? (
              <p className="error-text">{validationMap.fixedExpenseAmount.message}</p>
            ) : null}
          </FormField>

          <p className="muted budget-note">
            수동 고정지출은 이번 달 예산에서 미리 빼둘 계획 지출입니다. 교재비, 회비, 일회성
            납부금처럼 반복 등록하기 애매한 지출을 입력하세요.
          </p>

          <div className="stack">
            <p className="muted budget-save-note">
              예산에 반영되는 고정지출은 수동 고정지출과 자동 반영된 정기지출을 합산해 계산됩니다.
            </p>
            <p className="muted budget-save-note">
              수동 고정지출: {toDisplayNumber(manualFixedExpenseAmount)}원
            </p>
            <p className="muted budget-save-note">
              정기지출 합계: {toDisplayNumber(recurringExpenseTotal)}원
            </p>
            <p className="muted budget-save-note">
              예산에 반영되는 고정지출: {toDisplayNumber(totalFixedExpense)}원
            </p>
            <p className="muted budget-save-note">
              {formState.autoIncludeRecurringExpenses
                ? '정기지출 자동 반영이 켜져 있어 정기지출 합계가 예산에 포함됩니다.'
                : '정기지출 자동 반영이 꺼져 있어 정기지출 합계는 예산에 포함되지 않습니다.'}
            </p>
            {hasRecurringExpenses ? null : (
              <p className="muted budget-save-note">등록된 정기지출이 없습니다.</p>
            )}
          </div>

          <div className="budget-inline-stat">
            <span className="muted">수동 고정지출</span>
            <strong>{toDisplayNumber(manualFixedExpenseAmount)}원</strong>
          </div>
          <FormField id="emergencyFundAmount" label="비상금">
            <input
              id="emergencyFundAmount"
              type="text"
              inputMode="numeric"
              value={formState.emergencyFundAmount}
              onChange={updateField('emergencyFundAmount')}
              aria-invalid={Boolean(
                validationMap.emergencyFundAmount.message && shouldShowError('emergencyFundAmount')
              )}
              className={
                validationMap.emergencyFundAmount.message && shouldShowError('emergencyFundAmount')
                  ? 'input-error'
                  : ''
              }
            />
            {validationMap.emergencyFundAmount.message &&
            shouldShowError('emergencyFundAmount') ? (
              <p className="error-text">{validationMap.emergencyFundAmount.message}</p>
            ) : null}
          </FormField>

          <div className="carry-over-panel">
            <div className="section-head">
              <div>
                <h3 className="section-title">이월 금액</h3>
                <p className="muted">전날 남은 금액은 다음 날 예산에 추가되고, 달이 바뀌면 다음 달 예산에 반영됩니다.</p>
                <p className="muted">자동 계산 이월 금액은 지난달 기준으로 한 번만 계산되고, 같은 달에는 저장된 값을 다시 사용합니다.</p>
              </div>
              <div className="budget-inline-stat">
                <span className="muted">자동 계산 이월 금액</span>
                <strong>{toDisplayNumber(automaticCarryOverAmount)}</strong>
              </div>
              <p className="muted budget-month-note">
                이번 달 자동 이월은 지난달 기준으로 한 번만 계산되고, 같은 달에는 저장된 값을 다시 사용합니다.
              </p>
            </div>

            <ToggleRow
              id="manualCarryOverEnabled"
              label="수동 이월 금액 입력"
              checked={Boolean(formState.manualCarryOverEnabled)}
              onChange={updateField('manualCarryOverEnabled')}
            />

            {formState.manualCarryOverEnabled ? (
              <FormField id="manualCarryOverAmount" label="이월 금액">
                <input
                  id="manualCarryOverAmount"
                  type="text"
                  inputMode="numeric"
                  value={formState.manualCarryOverAmount}
                  onChange={updateField('manualCarryOverAmount')}
                  disabled={!formState.carryOverEnabled}
                  aria-invalid={Boolean(
                    validationMap.manualCarryOverAmount.message &&
                      shouldShowError('manualCarryOverAmount')
                  )}
                  className={
                    validationMap.manualCarryOverAmount.message &&
                    shouldShowError('manualCarryOverAmount')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.manualCarryOverAmount.message &&
                shouldShowError('manualCarryOverAmount') ? (
                  <p className="error-text">{validationMap.manualCarryOverAmount.message}</p>
                ) : null}
              </FormField>
            ) : null}
          </div>

          <div className="budget-divider" aria-hidden="true" />

          <div className="budget-section stack">
            <h2 className="section-title">기능 설정 카드</h2>

            <div className="toggle-list">
              {TOGGLE_FIELDS.map((item) => (
                <ToggleRow
                  key={item.key}
                  id={item.key}
                  label={item.label}
                  checked={Boolean(formState[item.key])}
                  onChange={updateField(item.key)}
                />
              ))}
              <ToggleRow
                id="autoIncludeRecurringExpenses"
                label="정기지출 자동 반영"
                checked={Boolean(formState.autoIncludeRecurringExpenses)}
                onChange={updateField('autoIncludeRecurringExpenses')}
              />
            </div>

            <div className="toggle-state-panel">
              <h3 className="section-title">기능 상태</h3>
              <p className="muted">
                목표 설정, 기간별 저축 계산, 이월 기능의 ON/OFF 상태를 한눈에 확인할 수 있도록 보여줍니다.
              </p>
            </div>
          </div>
        </section>

        <div className="budget-side stack">
          {formState.goalEnabled ? (
            <section className="card stack">
              <h2 className="section-title">월 저축 계획</h2>
              <p className="muted budget-note">
                월 저축 계획은 하루 예산 계산에 반영되는 저축 금액입니다. 이번 달에 먼저 저축할
                금액을 정하면, 남은 금액을 기준으로 하루 예산이 계산됩니다.
              </p>

              <FormField id="goalAmount" label="목표 금액">
                <input
                  id="goalAmount"
                  type="text"
                  inputMode="numeric"
                  value={formState.goalAmount}
                  onChange={updateField('goalAmount')}
                  aria-invalid={Boolean(
                    validationMap.goalAmount.message && shouldShowError('goalAmount')
                  )}
                  className={
                    validationMap.goalAmount.message && shouldShowError('goalAmount')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.goalAmount.message && shouldShowError('goalAmount') ? (
                  <p className="error-text">{validationMap.goalAmount.message}</p>
                ) : null}
              </FormField>

              <FormField id="goalPeriod" label="목표 기간">
                <input
                  id="goalPeriod"
                  type="text"
                  inputMode="numeric"
                  value={formState.goalPeriod}
                  onChange={updateField('goalPeriod')}
                  aria-invalid={Boolean(
                    validationMap.goalPeriod.message && shouldShowError('goalPeriod')
                  )}
                  className={
                    validationMap.goalPeriod.message && shouldShowError('goalPeriod')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.goalPeriod.message && shouldShowError('goalPeriod') ? (
                  <p className="error-text">{validationMap.goalPeriod.message}</p>
                ) : null}
              </FormField>

              <FormField id="currentSaving" label="현재 저축액">
                <input
                  id="currentSaving"
                  type="text"
                  inputMode="numeric"
                  value={formState.currentSaving}
                  onChange={updateField('currentSaving')}
                  aria-invalid={Boolean(
                    validationMap.currentSaving.message && shouldShowError('currentSaving')
                  )}
                  className={
                    validationMap.currentSaving.message && shouldShowError('currentSaving')
                      ? 'input-error'
                      : ''
                  }
                />
                {validationMap.currentSaving.message && shouldShowError('currentSaving') ? (
                  <p className="error-text">{validationMap.currentSaving.message}</p>
                ) : null}
              </FormField>
            </section>
          ) : null}

          {formState.periodCalculationEnabled ? (
            <section className="card stack">
              <h2 className="section-title">기간별 저축 계산 카드</h2>

              <div className="budget-inline-stats">
                <div className="budget-inline-stat">
                  <span className="muted">하루 필요 저축액</span>
                  <strong>{Math.round(goalPlan.dailyNeed).toLocaleString()}</strong>
                </div>
                <div className="budget-inline-stat">
                  <span className="muted">주간 필요 저축액</span>
                  <strong>{Math.round(goalPlan.weeklyNeed).toLocaleString()}</strong>
                </div>
                <div className="budget-inline-stat">
                  <span className="muted">월간 필요 저축액</span>
                  <strong>{Math.round(goalPlan.monthlyNeed).toLocaleString()}</strong>
                </div>
              </div>
            </section>
          ) : null}

        </div>

          <div className="form-actions budget-actions">
            <PrimaryButton type="submit" disabled={!formDirty || hasErrors}>
              저장하기
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <section className="card stack budget-goals-section">
          <h2 className="section-title">목표 계획 목록</h2>
          <p className="muted budget-goals-description">
            목표 계획 목록은 여행, 노트북, 비상금처럼 여러 목표를 따로 관리하는 계획용 기능입니다.
            이 목록은 현재 하루 예산 계산에 자동 반영되지 않으며, 계획 확인용으로 사용됩니다.
          </p>

          {goalCards.length > 0 ? (
            <div className="goal-grid">
              {goalCards.map((goal) => (
                <article
                  key={goal.id}
                  className={`card stack goal-card ${editingGoalId === goal.id ? 'is-editing' : ''}`}
                >
                  <div className="goal-card__header">
                    <div>
                      <h3 className="goal-card__title">{goal.name || '이름 없음'}</h3>
                      <p className="muted goal-card__category">카테고리: {goal.category || '기타'}</p>
                    </div>
                    {goal.isOverdue ? <span className="goal-card__badge">마감일 지남</span> : null}
                  </div>

                  <div className="goal-card__summary">
                    <div className="goal-card__money">
                      <div>
                        <span className="muted">목표 금액</span>
                        <strong>{toDisplayNumber(goal.targetAmount)}원</strong>
                      </div>
                      <div>
                        <span className="muted">현재 저축액</span>
                        <strong>{toDisplayNumber(goal.currentAmount)}원</strong>
                      </div>
                    </div>

                    <div className="goal-card__progress">
                      <span className="muted">달성률</span>
                      <strong>{Math.round(goal.achievementRate)}%</strong>
                    </div>

                    <div className="goal-card__detail-list">
                      <div className="goal-card__detail-item">
                        <span className="muted">남은 금액</span>
                        <strong>{toDisplayNumber(goal.remainingAmount)}원</strong>
                      </div>
                      <div className="goal-card__detail-item">
                        <span className="muted">마감일</span>
                        <strong>
                          {goal.deadline
                            ? new Intl.DateTimeFormat('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              }).format(new Date(goal.deadline))
                            : '미정'}
                        </strong>
                      </div>
                      <div className="goal-card__detail-item">
                        <span className="muted">남은 기간</span>
                        <strong>{goal.remainingDays > 0 ? `${goal.remainingDays}일` : '0일'}</strong>
                      </div>
                      <div className="goal-card__detail-item">
                        <span className="muted">하루 필요 저축액</span>
                        <strong>{toDisplayNumber(goal.dailyNeed)}원</strong>
                      </div>
                      <div className="goal-card__detail-item">
                        <span className="muted">월별 필요 저축액</span>
                        <strong>{toDisplayNumber(goal.monthlyNeed)}원</strong>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <PrimaryButton type="button" variant="ghost" onClick={() => startGoalEdit(goal)}>
                      수정
                    </PrimaryButton>
                    <PrimaryButton type="button" variant="subtle" onClick={() => handleGoalDelete(goal.id)}>
                      삭제
                    </PrimaryButton>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">아직 등록된 목표가 없습니다. 아래에서 목표를 추가해 보세요.</p>
          )}

          <form className="stack goal-form" onSubmit={handleGoalSubmit}>
            <div className="goal-form__grid">
              <FormField id="goalName" label="목표명(목록)">
                <input
                  id="goalName"
                  type="text"
                  value={goalFormState.name}
                  onChange={(event) =>
                    (setGoalFormState((current) => ({ ...current, name: event.target.value })),
                    setGoalFormError(''))
                  }
                />
              </FormField>

              <FormField id="goalCategory" label="카테고리(목록)">
                <select
                  id="goalCategory"
                  value={goalFormState.category}
                  onChange={(event) =>
                    (setGoalFormState((current) => ({ ...current, category: event.target.value })),
                    setGoalFormError(''))
                  }
                >
                  {GOAL_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField id="goalTargetAmount" label="목표 금액(목록)">
                <input
                  id="goalTargetAmount"
                  type="text"
                  inputMode="numeric"
                  value={goalFormState.targetAmount}
                  onChange={(event) =>
                    (
                      setGoalFormState((current) => ({
                        ...current,
                        targetAmount: event.target.value,
                      })),
                      setGoalFormError('')
                    )
                  }
                />
              </FormField>

              <FormField id="goalCurrentAmount" label="현재 저축액(목록)">
                <input
                  id="goalCurrentAmount"
                  type="text"
                  inputMode="numeric"
                  value={goalFormState.currentAmount}
                  onChange={(event) =>
                    (
                      setGoalFormState((current) => ({
                        ...current,
                        currentAmount: event.target.value,
                      })),
                      setGoalFormError('')
                    )
                  }
                />
              </FormField>

              <FormField id="goalDeadline" label="마감일(목록)">
                <input
                  id="goalDeadline"
                  type="date"
                  value={goalFormState.deadline}
                  onChange={(event) =>
                    (
                      setGoalFormState((current) => ({
                        ...current,
                        deadline: event.target.value,
                      })),
                      setGoalFormError('')
                    )
                  }
                />
              </FormField>
            </div>

            {goalFormError ? <p className="error-text">{goalFormError}</p> : null}

            <div className="form-actions">
              {editingGoalId ? (
                <PrimaryButton type="button" variant="ghost" onClick={resetGoalForm}>
                  수정 취소
                </PrimaryButton>
              ) : null}
              <PrimaryButton type="button" onClick={handleGoalSubmit}>
                {editingGoalId ? '목표 수정 저장' : '목표 추가'}
              </PrimaryButton>
            </div>
          </form>
        </section>
      )}
    </section>
  );
}

