import React, { useEffect, useMemo, useState } from 'react';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import SummaryCard from '../components/SummaryCard';
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

function toDisplayNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString() : '0';
}

export default function BudgetSettings({
  monthlyIncome,
  budgetSettings,
  savingGoalSettings,
  dailyBudget,
  remainingDays,
  onSave,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);

  useEffect(() => {
    setFormState({
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
    });
  }, [budgetSettings, monthlyIncome, savingGoalSettings]);

  const goalPlan = useMemo(
    () =>
      formState.goalEnabled
        ? calculateGoalSavingPlan({
            goalAmount: formState.goalAmount,
            currentSaving: formState.currentSaving,
            goalPeriod: formState.goalPeriod,
          })
        : {
            remainingAmount: 0,
            dailyNeed: 0,
            weeklyNeed: 0,
            monthlyNeed: 0,
          },
    [formState.currentSaving, formState.goalAmount, formState.goalEnabled, formState.goalPeriod]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      monthlyIncome: formState.monthlyIncome,
      budgetSettings: {
        useManualBudget: formState.useManualBudget,
        manualDailyBudget: formState.manualDailyBudget,
        fixedExpenseAmount: formState.fixedExpenseAmount,
        emergencyFundAmount: formState.emergencyFundAmount,
        goalEnabled: formState.goalEnabled,
        periodCalculationEnabled: formState.periodCalculationEnabled,
        carryOverEnabled: formState.carryOverEnabled,
        carryOverAmount: formState.carryOverAmount,
      },
      savingGoalSettings: {
        goalAmount: formState.goalAmount,
        goalPeriod: formState.goalPeriod,
        currentSaving: formState.currentSaving,
      },
    });
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
            월 수입, 수동 예산, 저축 목표를 카드 단위로 나눠서 확인합니다.
          </p>
        </div>
      </div>

      <div className="grid-3">
        <SummaryCard
          title="오늘 예산 미리보기"
          value={`${Math.round(dailyBudget).toLocaleString()}원`}
          note={`남은 일수 ${remainingDays}일`}
        />
        <SummaryCard
          title="월 수입"
          value={`${toDisplayNumber(formState.monthlyIncome)}원`}
          note="자동 계산의 기준값"
        />
        <SummaryCard
          title="목표 저축"
          value={`${toDisplayNumber(goalPlan.remainingAmount)}원`}
          note="현재 저축을 뺀 남은 목표 금액"
        />
      </div>

      <form className="grid-2" onSubmit={handleSubmit}>
        <section className="card stack">
          <h2 className="section-title">기본 예산 카드</h2>

          <FormField id="monthlyIncome" label="월 수입">
            <input
              id="monthlyIncome"
              type="number"
              inputMode="numeric"
              value={formState.monthlyIncome}
              onChange={updateField('monthlyIncome')}
            />
          </FormField>

          <FormField id="manualDailyBudget" label="수동 하루 예산">
            <input
              id="manualDailyBudget"
              type="number"
              inputMode="numeric"
              value={formState.manualDailyBudget}
              onChange={updateField('manualDailyBudget')}
              disabled={!formState.useManualBudget}
            />
          </FormField>

          <FormField id="fixedExpenseAmount" label="고정지출">
            <input
              id="fixedExpenseAmount"
              type="number"
              inputMode="numeric"
              value={formState.fixedExpenseAmount}
              onChange={updateField('fixedExpenseAmount')}
            />
          </FormField>

          <FormField id="emergencyFundAmount" label="비상금">
            <input
              id="emergencyFundAmount"
              type="number"
              inputMode="numeric"
              value={formState.emergencyFundAmount}
              onChange={updateField('emergencyFundAmount')}
            />
          </FormField>

          <FormField id="carryOverAmount" label="이월 금액">
            <input
              id="carryOverAmount"
              type="number"
              inputMode="numeric"
              value={formState.carryOverAmount}
              onChange={updateField('carryOverAmount')}
              disabled={!formState.carryOverEnabled}
            />
          </FormField>
        </section>

        <section className="card stack">
          <h2 className="section-title">기능 토글 카드</h2>

          <FormField id="useManualBudget" label="수동 하루 예산 사용">
            <input
              id="useManualBudget"
              type="checkbox"
              checked={formState.useManualBudget}
              onChange={updateField('useManualBudget')}
            />
          </FormField>

          <FormField id="goalEnabled" label="목표 설정">
            <input
              id="goalEnabled"
              type="checkbox"
              checked={formState.goalEnabled}
              onChange={updateField('goalEnabled')}
            />
          </FormField>

          <FormField id="periodCalculationEnabled" label="기간별 저축 계산">
            <input
              id="periodCalculationEnabled"
              type="checkbox"
              checked={formState.periodCalculationEnabled}
              onChange={updateField('periodCalculationEnabled')}
            />
          </FormField>

          <FormField id="carryOverEnabled" label="이월 기능">
            <input
              id="carryOverEnabled"
              type="checkbox"
              checked={formState.carryOverEnabled}
              onChange={updateField('carryOverEnabled')}
            />
          </FormField>

          <div className="card stack">
            <h3 className="section-title">기능 상태</h3>
            <p className="muted">
              목표 설정, 기간별 계산, 이월 기능은 ON/OFF 상태를 저장하고 마이페이지에서 확인합니다.
            </p>
          </div>
        </section>

        {formState.goalEnabled ? (
          <section className="card stack">
            <h2 className="section-title">목표 설정 카드</h2>

            <FormField id="goalAmount" label="목표 금액">
              <input
                id="goalAmount"
                type="number"
                inputMode="numeric"
                value={formState.goalAmount}
                onChange={updateField('goalAmount')}
              />
            </FormField>

            <FormField id="goalPeriod" label="목표 기간(일)">
              <input
                id="goalPeriod"
                type="number"
                inputMode="numeric"
                value={formState.goalPeriod}
                onChange={updateField('goalPeriod')}
              />
            </FormField>

            <FormField id="currentSaving" label="현재 저축 금액">
              <input
                id="currentSaving"
                type="number"
                inputMode="numeric"
                value={formState.currentSaving}
                onChange={updateField('currentSaving')}
              />
            </FormField>
          </section>
        ) : null}

        {formState.periodCalculationEnabled ? (
          <section className="card stack">
            <h2 className="section-title">기간별 계산 카드</h2>

            <SummaryCard
              title="하루 필요 저축 금액"
              value={`${Math.round(goalPlan.dailyNeed).toLocaleString()}원`}
              note="목표 금액을 기간으로 나눈 값"
            />
            <SummaryCard
              title="주간 필요 저축 금액"
              value={`${Math.round(goalPlan.weeklyNeed).toLocaleString()}원`}
              note="하루 필요 저축 금액 × 7"
            />
            <SummaryCard
              title="월 필요 저축 금액"
              value={`${Math.round(goalPlan.monthlyNeed).toLocaleString()}원`}
              note="하루 필요 저축 금액 × 30"
            />
          </section>
        ) : null}

        <div className="form-actions">
          <PrimaryButton type="submit">저장하기</PrimaryButton>
        </div>
      </form>
    </section>
  );
}
