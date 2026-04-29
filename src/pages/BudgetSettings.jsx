import React, { useEffect, useMemo, useState } from 'react';
import FormField from '../components/FormField';
import MetricStrip from '../components/MetricStrip';
import PrimaryButton from '../components/PrimaryButton';
import ToggleRow from '../components/ToggleRow';
import { calculateGoalSavingPlan } from '../lib/budget';

const DEFAULT_FORM = {
  monthlyIncome: '',
  useManualBudget: false,
  manualDailyBudget: '',
  fixedExpenseAmount: '',
  emergencyFundAmount: '',
  goalEnabled: true,
  periodCalculationEnabled: true,
  carryOverEnabled: true,
  carryOverAmount: '',
  goalAmount: '',
  goalPeriod: '',
  currentSaving: '',
};

const TOGGLE_FIELDS = [
  { key: 'useManualBudget', label: '수동 하루 예산 사용' },
  { key: 'goalEnabled', label: '목표 설정' },
  { key: 'periodCalculationEnabled', label: '기간별 저축 계산' },
  { key: 'carryOverEnabled', label: '이월 기능' },
];

function toDisplayNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : '0';
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
    return { isValid: false, message: '숫자만 입력할 수 있어요.', normalizedValue: text };
  }

  const numericValue = Number(text);

  if (!Number.isFinite(numericValue)) {
    return { isValid: false, message: '숫자만 입력할 수 있어요.', normalizedValue: text };
  }

  if (integer && !Number.isInteger(numericValue)) {
    return { isValid: false, message: integerMessage, normalizedValue: text };
  }

  const invalid =
    inclusive ? numericValue < min : numericValue <= min;

  if (invalid) {
    return { isValid: false, message: minMessage, normalizedValue: text };
  }

  return { isValid: true, message: '', normalizedValue: text };
}

function buildValidationMap(formState) {
  return {
    monthlyIncome: validateBudgetNumber(formState.monthlyIncome, {
      emptyMessage: '월 수입을 입력해주세요.',
      minMessage: '월 수입은 0보다 큰 숫자로 입력해주세요.',
      min: 0,
      inclusive: false,
    }),
    manualDailyBudget: validateBudgetNumber(formState.manualDailyBudget, {
      enabled: formState.useManualBudget,
      allowEmpty: true,
      emptyMessage: '수동 하루 예산을 입력해주세요.',
      minMessage: '수동 하루 예산은 0보다 큰 숫자로 입력해주세요.',
      min: 0,
      inclusive: false,
    }),
    fixedExpenseAmount: validateBudgetNumber(formState.fixedExpenseAmount, {
      emptyMessage: '고정지출 금액을 입력해주세요.',
      minMessage: '고정지출은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    emergencyFundAmount: validateBudgetNumber(formState.emergencyFundAmount, {
      emptyMessage: '비상금 금액을 입력해주세요.',
      minMessage: '비상금은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    carryOverAmount: validateBudgetNumber(formState.carryOverAmount, {
      enabled: formState.carryOverEnabled,
      emptyMessage: '이월 금액을 입력해주세요.',
      minMessage: '이월 금액은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
    goalAmount: validateBudgetNumber(formState.goalAmount, {
      enabled: formState.goalEnabled,
      emptyMessage: '목표 금액을 입력해주세요.',
      minMessage: '목표 금액은 0보다 큰 숫자로 입력해주세요.',
      min: 0,
      inclusive: false,
    }),
    goalPeriod: validateBudgetNumber(formState.goalPeriod, {
      enabled: formState.goalEnabled,
      integer: true,
      emptyMessage: '목표 기간을 입력해주세요.',
      minMessage: '목표 기간은 1 이상으로 입력해주세요.',
      integerMessage: '목표 기간은 정수로 입력해주세요.',
      min: 1,
      inclusive: true,
    }),
    currentSaving: validateBudgetNumber(formState.currentSaving, {
      enabled: formState.goalEnabled,
      emptyMessage: '현재 저축 금액을 입력해주세요.',
      minMessage: '현재 저축 금액은 0 이상으로 입력해주세요.',
      min: 0,
      inclusive: true,
    }),
  };
}

function hasUnsavedChanges(formState, props) {
  return (
    String(formState.monthlyIncome ?? '') !== String(props.monthlyIncome ?? '') ||
    Boolean(formState.useManualBudget) !== Boolean(props.budgetSettings.useManualBudget) ||
    String(formState.manualDailyBudget ?? '') !== String(props.budgetSettings.manualDailyBudget ?? '') ||
    String(formState.fixedExpenseAmount ?? '') !== String(props.budgetSettings.fixedExpenseAmount ?? '') ||
    String(formState.emergencyFundAmount ?? '') !== String(props.budgetSettings.emergencyFundAmount ?? '') ||
    Boolean(formState.goalEnabled) !== Boolean(props.budgetSettings.goalEnabled) ||
    Boolean(formState.periodCalculationEnabled) !== Boolean(props.budgetSettings.periodCalculationEnabled) ||
    Boolean(formState.carryOverEnabled) !== Boolean(props.budgetSettings.carryOverEnabled) ||
    String(formState.carryOverAmount ?? '') !== String(props.budgetSettings.carryOverAmount ?? '') ||
    String(formState.goalAmount ?? '') !== String(props.savingGoalSettings.goalAmount ?? '') ||
    String(formState.goalPeriod ?? '') !== String(props.savingGoalSettings.goalPeriod ?? '') ||
    String(formState.currentSaving ?? '') !== String(props.savingGoalSettings.currentSaving ?? '')
  );
}

export default function BudgetSettings({
  monthlyIncome,
  budgetSettings,
  savingGoalSettings,
  recurringExpenses = [],
  dailyBudget,
  remainingDays,
  onSave,
  showToast,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [recurringLoadMessage, setRecurringLoadMessage] = useState('');

  useEffect(() => {
    setFormState((current) => ({
      ...current,
      monthlyIncome: String(monthlyIncome || ''),
      useManualBudget: Boolean(budgetSettings.useManualBudget),
      manualDailyBudget: String(budgetSettings.manualDailyBudget || ''),
      fixedExpenseAmount: String(budgetSettings.fixedExpenseAmount || ''),
      emergencyFundAmount: String(budgetSettings.emergencyFundAmount || ''),
      goalEnabled: Boolean(budgetSettings.goalEnabled),
      periodCalculationEnabled: Boolean(budgetSettings.periodCalculationEnabled),
      carryOverEnabled: Boolean(budgetSettings.carryOverEnabled),
      carryOverAmount: String(budgetSettings.carryOverAmount || ''),
      goalAmount: String(savingGoalSettings.goalAmount || ''),
      goalPeriod: String(savingGoalSettings.goalPeriod || ''),
      currentSaving: String(savingGoalSettings.currentSaving || ''),
    }));
    setSubmitAttempted(false);
  }, [
    budgetSettings.carryOverAmount,
    budgetSettings.carryOverEnabled,
    budgetSettings.emergencyFundAmount,
    budgetSettings.fixedExpenseAmount,
    budgetSettings.goalEnabled,
    budgetSettings.manualDailyBudget,
    budgetSettings.periodCalculationEnabled,
    budgetSettings.useManualBudget,
    monthlyIncome,
    savingGoalSettings.currentSaving,
    savingGoalSettings.goalAmount,
    savingGoalSettings.goalPeriod,
  ]);

  const validationMap = useMemo(() => buildValidationMap(formState), [formState]);

  const goalPlan = useMemo(() => {
    if (!budgetSettings.goalEnabled) {
      return emptyGoalPlan();
    }

    return calculateGoalSavingPlan(savingGoalSettings);
  }, [budgetSettings.goalEnabled, savingGoalSettings]);

  const recurringExpenseTotal = useMemo(
    () =>
      recurringExpenses.reduce((sum, item) => {
        const amount = Number(item.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [recurringExpenses]
  );

  const hasRecurringExpenses = recurringExpenses.length > 0;

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

  const shouldShowError = (key) => submitAttempted || formDirty;

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors) {
      return;
    }

    onSave({
      monthlyIncome: validationMap.monthlyIncome.normalizedValue,
      budgetSettings: {
        useManualBudget: formState.useManualBudget,
        manualDailyBudget: validationMap.manualDailyBudget.normalizedValue,
        fixedExpenseAmount: validationMap.fixedExpenseAmount.normalizedValue,
        emergencyFundAmount: validationMap.emergencyFundAmount.normalizedValue,
        goalEnabled: formState.goalEnabled,
        periodCalculationEnabled: formState.periodCalculationEnabled,
        carryOverEnabled: formState.carryOverEnabled,
        carryOverAmount: validationMap.carryOverAmount.normalizedValue,
      },
      savingGoalSettings: {
        goalAmount: validationMap.goalAmount.normalizedValue,
        goalPeriod: validationMap.goalPeriod.normalizedValue,
        currentSaving: validationMap.currentSaving.normalizedValue,
      },
    });
    showToast?.('예산 설정이 저장되었습니다');
    setSubmitAttempted(false);
  };

  const handleLoadRecurringExpenseTotal = () => {
    if (!hasRecurringExpenses) {
      return;
    }

    setFormState((current) => ({
      ...current,
      fixedExpenseAmount: String(recurringExpenseTotal),
    }));
    setRecurringLoadMessage(
      `정기지출 합계 ${toDisplayNumber(recurringExpenseTotal)}원을 불러왔습니다. 저장하기를 눌러 적용하세요.`
    );
    showToast?.('정기지출 합계를 불러왔습니다');
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">예산 설정</h1>
          <p className="page-subtitle">
            월 수입, 하루 예산, 목표 저축을 카드 단위로 나누어 확인합니다.
          </p>
        </div>
      </div>

      <MetricStrip
        items={[
          {
            title: '오늘 예산 미리보기',
            value: `${Math.round(dailyBudget).toLocaleString()}원`,
            note: `예상 사용 ${remainingDays}일`,
          },
          {
            title: '월 수입',
            value: `${toDisplayNumber(monthlyIncome)}원`,
            note: '저장된 수입 기준',
          },
          {
            title: '목표 저축',
            value: `${toDisplayNumber(goalPlan.remainingAmount)}원`,
            note: '저장된 목표 설정 기준',
          },
        ]}
      />

      <form className="budget-layout" onSubmit={handleSubmit}>
        <section className="card stack budget-main">
          <h2 className="section-title">기본 예산 카드</h2>
          <p className="muted budget-save-note">
            입력한 값은 &apos;저장하기&apos;를 눌러야 적용됩니다.
          </p>

          {formDirty ? <p className="muted budget-save-dirty">저장되지 않은 변경사항이 있습니다.</p> : null}

          <FormField id="monthlyIncome" label="월 수입">
            <input
              id="monthlyIncome"
              type="text"
              inputMode="numeric"
              value={formState.monthlyIncome}
              onChange={updateField('monthlyIncome')}
              aria-invalid={Boolean(validationMap.monthlyIncome.message && shouldShowError('monthlyIncome'))}
              className={validationMap.monthlyIncome.message && shouldShowError('monthlyIncome') ? 'input-error' : ''}
            />
            {validationMap.monthlyIncome.message && shouldShowError('monthlyIncome') ? (
              <p className="error-text">{validationMap.monthlyIncome.message}</p>
            ) : null}
          </FormField>

          <FormField id="manualDailyBudget" label="수동 하루 예산">
            <input
              id="manualDailyBudget"
              type="text"
              inputMode="numeric"
              value={formState.manualDailyBudget}
              onChange={updateField('manualDailyBudget')}
              disabled={!formState.useManualBudget}
              aria-invalid={
                Boolean(validationMap.manualDailyBudget.message && shouldShowError('manualDailyBudget'))
              }
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

          <FormField id="fixedExpenseAmount" label="고정지출">
            <input
              id="fixedExpenseAmount"
              type="text"
              inputMode="numeric"
              value={formState.fixedExpenseAmount}
              onChange={updateField('fixedExpenseAmount')}
              aria-invalid={
                Boolean(validationMap.fixedExpenseAmount.message && shouldShowError('fixedExpenseAmount'))
              }
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

          <div className="budget-inline-actions">
            <PrimaryButton
              type="button"
              variant="subtle"
              onClick={handleLoadRecurringExpenseTotal}
              disabled={!hasRecurringExpenses}
            >
              정기지출 합계 불러오기
            </PrimaryButton>
            <p className="muted budget-inline-note">
              {hasRecurringExpenses
                ? recurringLoadMessage || '등록된 정기지출이 있으면 고정지출 입력값에 합계를 불러올 수 있어요.'
                : '등록된 정기지출이 없습니다.'}
            </p>
          </div>

          <FormField id="emergencyFundAmount" label="비상금">
            <input
              id="emergencyFundAmount"
              type="text"
              inputMode="numeric"
              value={formState.emergencyFundAmount}
              onChange={updateField('emergencyFundAmount')}
              aria-invalid={
                Boolean(validationMap.emergencyFundAmount.message && shouldShowError('emergencyFundAmount'))
              }
              className={
                validationMap.emergencyFundAmount.message && shouldShowError('emergencyFundAmount')
                  ? 'input-error'
                  : ''
              }
            />
            {validationMap.emergencyFundAmount.message && shouldShowError('emergencyFundAmount') ? (
              <p className="error-text">{validationMap.emergencyFundAmount.message}</p>
            ) : null}
          </FormField>

          <FormField id="carryOverAmount" label="이월 금액">
            <input
              id="carryOverAmount"
              type="text"
              inputMode="numeric"
              value={formState.carryOverAmount}
              onChange={updateField('carryOverAmount')}
              disabled={!formState.carryOverEnabled}
              aria-invalid={
                Boolean(validationMap.carryOverAmount.message && shouldShowError('carryOverAmount'))
              }
              className={
                validationMap.carryOverAmount.message && shouldShowError('carryOverAmount')
                  ? 'input-error'
                  : ''
              }
            />
            {validationMap.carryOverAmount.message && shouldShowError('carryOverAmount') ? (
              <p className="error-text">{validationMap.carryOverAmount.message}</p>
            ) : null}
          </FormField>

          <div className="budget-divider" aria-hidden="true" />

          <div className="budget-section stack">
            <h2 className="section-title">기능 토글 카드</h2>

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
            </div>

            <div className="toggle-state-panel">
              <h3 className="section-title">기능 상태</h3>
              <p className="muted">
                목표 설정, 기간별 계산, 이월 기능의 ON/OFF 상태는 저장하기를 눌러야 적용됩니다.
              </p>
            </div>
          </div>
        </section>

        <div className="budget-side stack">
          {formState.goalEnabled ? (
            <section className="card stack">
              <h2 className="section-title">목표 설정 카드</h2>

              <FormField id="goalAmount" label="목표 금액">
                <input
                  id="goalAmount"
                  type="text"
                  inputMode="numeric"
                  value={formState.goalAmount}
                  onChange={updateField('goalAmount')}
                  aria-invalid={Boolean(validationMap.goalAmount.message && shouldShowError('goalAmount'))}
                  className={validationMap.goalAmount.message && shouldShowError('goalAmount') ? 'input-error' : ''}
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
                  aria-invalid={Boolean(validationMap.goalPeriod.message && shouldShowError('goalPeriod'))}
                  className={validationMap.goalPeriod.message && shouldShowError('goalPeriod') ? 'input-error' : ''}
                />
                {validationMap.goalPeriod.message && shouldShowError('goalPeriod') ? (
                  <p className="error-text">{validationMap.goalPeriod.message}</p>
                ) : null}
              </FormField>

              <FormField id="currentSaving" label="현재 저축 금액">
                <input
                  id="currentSaving"
                  type="text"
                  inputMode="numeric"
                  value={formState.currentSaving}
                  onChange={updateField('currentSaving')}
                  aria-invalid={
                    Boolean(validationMap.currentSaving.message && shouldShowError('currentSaving'))
                  }
                  className={validationMap.currentSaving.message && shouldShowError('currentSaving') ? 'input-error' : ''}
                />
                {validationMap.currentSaving.message && shouldShowError('currentSaving') ? (
                  <p className="error-text">{validationMap.currentSaving.message}</p>
                ) : null}
              </FormField>
            </section>
          ) : null}

          {formState.periodCalculationEnabled ? (
            <section className="card stack">
              <h2 className="section-title">기간별 계산 카드</h2>

              <div className="budget-inline-stats">
                <div className="budget-inline-stat">
                  <span className="muted">하루 필요 저축 금액</span>
                  <strong>{Math.round(goalPlan.dailyNeed).toLocaleString()}원</strong>
                </div>
                <div className="budget-inline-stat">
                  <span className="muted">주간 필요 저축 금액</span>
                  <strong>{Math.round(goalPlan.weeklyNeed).toLocaleString()}원</strong>
                </div>
                <div className="budget-inline-stat">
                  <span className="muted">월간 필요 저축 금액</span>
                  <strong>{Math.round(goalPlan.monthlyNeed).toLocaleString()}원</strong>
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
    </section>
  );
}
