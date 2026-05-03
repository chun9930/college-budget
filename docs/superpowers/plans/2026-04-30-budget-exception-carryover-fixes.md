# 예산 계산 예외 처리와 이월 표시 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예산 설정과 홈의 계산 흐름에서 빈 값, 비정상 값, 이월 표시, 정기지출 합계, 오늘 예산 미리보기 오류를 수정한다.

**Architecture:** `calculateDailyBudget()` 본체는 유지하고, 호출부에서 저장된 값만 계산에 전달한다. `BudgetSettings.jsx`는 form state와 saved state 분리를 유지하면서 저장 시 안전한 기본값으로 정규화한다. 자동 이월은 현재 데이터 기준 계산값으로 표시하고, 수동 이월은 별도 토글이 켜졌을 때만 입력 가능하게 한다.

**Tech Stack:** React, Vite, localStorage, Vitest, React Testing Library

---

### Task 1: 예산 설정 저장 정규화 테스트

**Files:**
- Modify: `src/pages/BudgetSettings.test.jsx`
- Modify: `src/pages/BudgetSettings.jsx`

- [ ] **Step 1: 빈 금액 저장 테스트 추가**

```jsx
it('normalizes empty money fields to 0 when saving', () => {
  const onSave = vi.fn();
  renderBudgetSettings({
    onSave,
    monthlyIncome: 1000000,
    budgetSettings: {
      useManualBudget: false,
      manualDailyBudget: '',
      fixedExpenseAmount: '',
      emergencyFundAmount: '',
      goalEnabled: false,
      periodCalculationEnabled: false,
      carryOverEnabled: true,
      carryOverAmount: '',
      manualCarryOverEnabled: false,
      manualCarryOverAmount: '',
    },
    savingGoalSettings: {
      goalAmount: '',
      goalPeriod: '',
      currentSaving: '',
    },
  });

  fireEvent.change(screen.getByLabelText('월 수입'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      monthlyIncome: '0',
      budgetSettings: expect.objectContaining({
        fixedExpenseAmount: '0',
        emergencyFundAmount: '0',
      }),
    })
  );
});
```

- [ ] **Step 2: 목표 기간 0이면 목표 설정 OFF 저장 테스트 추가**

```jsx
it('turns goal settings off when goal period is 0 on save', () => {
  const onSave = vi.fn();
  renderBudgetSettings({ onSave });

  fireEvent.change(screen.getByLabelText('목표 기간'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      budgetSettings: expect.objectContaining({
        goalEnabled: false,
        periodCalculationEnabled: false,
      }),
    })
  );
});
```

### Task 2: 이월 UI와 저장 구조 분리

**Files:**
- Modify: `src/pages/BudgetSettings.test.jsx`
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: 자동 이월 설명과 수동 이월 토글 테스트 추가**

```jsx
it('shows automatic carry over amount and enables manual input only by toggle', () => {
  renderBudgetSettings({
    automaticCarryOverAmount: 100000,
    budgetSettings: {
      useManualBudget: false,
      manualDailyBudget: '',
      fixedExpenseAmount: '0',
      emergencyFundAmount: '0',
      goalEnabled: false,
      periodCalculationEnabled: false,
      carryOverEnabled: true,
      carryOverAmount: '100000',
      manualCarryOverEnabled: false,
      manualCarryOverAmount: '',
    },
  });

  expect(screen.getByText('전날 남은 금액을 다음 날 예산에 추가합니다.')).toBeInTheDocument();
  expect(screen.getByText('자동 계산 이월 금액')).toBeInTheDocument();
  expect(screen.getByText('100,000원')).toBeInTheDocument();
  expect(screen.queryByLabelText('이월 금액')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('switch', { name: '수동 이월 금액 입력' }));

  expect(screen.getByLabelText('이월 금액')).toBeInTheDocument();
});
```

- [ ] **Step 2: 수동 이월 invalid 값이면 수동 모드 OFF 저장 테스트 추가**

```jsx
it('turns manual carry over off when manual amount is invalid', () => {
  const onSave = vi.fn();
  renderBudgetSettings({
    onSave,
    automaticCarryOverAmount: 100000,
    budgetSettings: {
      useManualBudget: false,
      manualDailyBudget: '',
      fixedExpenseAmount: '0',
      emergencyFundAmount: '0',
      goalEnabled: false,
      periodCalculationEnabled: false,
      carryOverEnabled: true,
      carryOverAmount: '100000',
      manualCarryOverEnabled: true,
      manualCarryOverAmount: '50000',
    },
  });

  fireEvent.change(screen.getByLabelText('이월 금액'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      budgetSettings: expect.objectContaining({
        manualCarryOverEnabled: false,
        manualCarryOverAmount: '0',
        carryOverAmount: '100000',
      }),
    })
  );
});
```

### Task 3: App 계산 호출부 수정

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: fixedExpenseTotal은 저장된 고정지출만 쓰도록 테스트 추가**

```jsx
it('uses saved fixed expense value without automatically adding recurring total', () => {
  expect(
    calculateDailyBudget({
      monthlyIncome: 1000000,
      carryOver: 0,
      targetSavings: 0,
      emergencyFund: 0,
      fixedExpenses: 5000,
      spent: 0,
      remainingDays: 2,
    })
  ).toBe(497500);
});
```

- [ ] **Step 2: `App.jsx`에서 `fixedExpenseTotal = toNumber(budgetSettings.fixedExpenseAmount)`로 수정**

```js
const recurringMonthlyTotal = useMemo(
  () => recurringExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0),
  [recurringExpenses]
);

const fixedExpenseTotal = toNumber(budgetSettings.fixedExpenseAmount);
```

### Task 4: 문서와 검증

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-30.md`

- [ ] **Step 1: README 관련 섹션만 갱신**

`이월 기능` 설명을 현재 구현 기준으로 수정한다.

- [ ] **Step 2: 검증 명령 실행**

Run:
`npm.cmd exec esbuild -- src/App.jsx src/App.test.jsx src/pages/BudgetSettings.jsx src/pages/BudgetSettings.test.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`

Expected:
문법 오류 없이 통과한다.

