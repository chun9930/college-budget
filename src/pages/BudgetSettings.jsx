import { useState } from 'react';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import SummaryCard from '../components/SummaryCard';

export default function BudgetSettings({
  monthlyIncome,
  budgetSettings,
  dailyBudget,
  remainingDays,
  onSave,
}) {
  const [formState, setFormState] = useState({
    monthlyIncome: String(monthlyIncome || ''),
    useManualBudget: Boolean(budgetSettings.useManualBudget),
    manualDailyBudget: String(budgetSettings.manualDailyBudget || ''),
    carryOverEnabled: Boolean(budgetSettings.carryOverEnabled),
    carryOverAmount: String(budgetSettings.carryOverAmount || ''),
    targetSavings: String(budgetSettings.targetSavings || ''),
    emergencyFund: String(budgetSettings.emergencyFund || ''),
    fixedExpenseAmount: String(budgetSettings.fixedExpenseAmount || ''),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      monthlyIncome: formState.monthlyIncome,
      budgetSettings: {
        useManualBudget: formState.useManualBudget,
        manualDailyBudget: formState.manualDailyBudget,
        carryOverEnabled: formState.carryOverEnabled,
        carryOverAmount: formState.carryOverAmount,
        targetSavings: formState.targetSavings,
        emergencyFund: formState.emergencyFund,
        fixedExpenseAmount: formState.fixedExpenseAmount,
      },
    });
  };

  const updateField = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
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
            월 수입과 제외 금액을 입력하면 오늘 사용할 수 있는 금액이 자동으로 계산됩니다.
          </p>
        </div>
      </div>

      <div className="grid-3">
        <SummaryCard
          title="자동 하루 예산"
          value={`${Math.round(dailyBudget).toLocaleString()}원`}
          note={`남은 일수 ${remainingDays}일 기준`}
        />
        <SummaryCard title="월 수입" value={`${Number(formState.monthlyIncome || 0).toLocaleString()}원`} />
        <SummaryCard
          title="저축 / 비상금 제외"
          value={`${(
            Number(formState.targetSavings || 0) + Number(formState.emergencyFund || 0)
          ).toLocaleString()}원`}
        />
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <FormField id="monthlyIncome" label="월 수입">
          <input
            id="monthlyIncome"
            type="number"
            inputMode="numeric"
            value={formState.monthlyIncome}
            onChange={updateField('monthlyIncome')}
          />
        </FormField>

        <FormField id="targetSavings" label="목표 저축">
          <input
            id="targetSavings"
            type="number"
            inputMode="numeric"
            value={formState.targetSavings}
            onChange={updateField('targetSavings')}
          />
        </FormField>

        <FormField id="emergencyFund" label="비상금 제외">
          <input
            id="emergencyFund"
            type="number"
            inputMode="numeric"
            value={formState.emergencyFund}
            onChange={updateField('emergencyFund')}
          />
        </FormField>

        <details className="card stack" open>
          <summary className="section-title">고급 설정</summary>

          <FormField id="useManualBudget" label="수동 예산 사용">
            <input
              id="useManualBudget"
              type="checkbox"
              checked={formState.useManualBudget}
              onChange={updateField('useManualBudget')}
            />
          </FormField>

          <FormField id="manualDailyBudget" label="수동 하루 예산">
            <input
              id="manualDailyBudget"
              type="number"
              inputMode="numeric"
              value={formState.manualDailyBudget}
              onChange={updateField('manualDailyBudget')}
            />
          </FormField>

          <FormField id="carryOverEnabled" label="이월 사용">
            <input
              id="carryOverEnabled"
              type="checkbox"
              checked={formState.carryOverEnabled}
              onChange={updateField('carryOverEnabled')}
            />
          </FormField>

          <FormField id="carryOverAmount" label="이월 금액">
            <input
              id="carryOverAmount"
              type="number"
              inputMode="numeric"
              value={formState.carryOverAmount}
              onChange={updateField('carryOverAmount')}
            />
          </FormField>

          <FormField id="fixedExpenseAmount" label="월 고정지출">
            <input
              id="fixedExpenseAmount"
              type="number"
              inputMode="numeric"
              value={formState.fixedExpenseAmount}
              onChange={updateField('fixedExpenseAmount')}
            />
          </FormField>
        </details>

        <div className="form-actions">
          <PrimaryButton type="submit">저장</PrimaryButton>
        </div>
      </form>
    </section>
  );
}

