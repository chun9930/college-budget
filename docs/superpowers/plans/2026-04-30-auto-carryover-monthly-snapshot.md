# 자동 이월 월별 스냅샷 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자동 이월을 월 변경 기준으로 1회만 계산하고, 같은 달에는 저장된 스냅샷을 재사용해 carryOver 중복 반영을 막는다.

**Architecture:** 계정별 snapshot에 `carryOverState`를 저장해 현재 월의 자동 이월 계산 결과와 계산 시점을 함께 보관한다. `App.jsx`는 현재 월 키를 기준으로 snapshot이 없을 때만 자동 이월을 계산하고, `BudgetSettings`는 계산 결과를 읽기 전용 요약으로 보여 준다. 계산식은 기존 고정지출/정기지출 분리 기준을 유지하되 carryOver 재포함은 막는다.

**Tech Stack:** React, Vite, localStorage, Vitest

---

### Task 1: carryOver snapshot storage

**Files:**
- Modify: `src/lib/storage.js`
- Modify: `src/App.jsx`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
it('stores carry over snapshot per month for the logged-in account', () => {
  // current account snapshot should expose carryOverState with lastCalculatedMonth
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL because `carryOverState` is not present yet.

- [ ] **Step 3: Write minimal implementation**

```js
const DEFAULT_CARRY_OVER_STATE = {
  lastCalculatedMonth: '',
  monthlySnapshots: {},
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS.

### Task 2: month-based auto carryover calculation

**Files:**
- Modify: `src/lib/budget.js`
- Modify: `src/App.jsx`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
it('does not re-include carryOver when calculating automatic carryover', () => {
  // calculateAutomaticCarryOver should ignore existing carryOverAmount
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL because the current calculation still uses carryOver.

- [ ] **Step 3: Write minimal implementation**

```js
export function calculateAutomaticCarryOver({
  monthlyIncome = 0,
  fixedExpenses = '',
  targetSavings = '',
  emergencyFund = '',
  spent = '',
} = {}) {
  const previousBudget =
    toNumber(monthlyIncome) -
    toNumber(fixedExpenses) -
    toNumber(targetSavings) -
    toNumber(emergencyFund);

  return Math.max(0, previousBudget - toNumber(spent));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS.

### Task 3: BudgetSettings snapshot display

**Files:**
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/pages/BudgetSettings.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
it('shows the monthly auto carryover snapshot summary', () => {
  // BudgetSettings should show the current month snapshot explanation
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL before the snapshot prop is wired.

- [ ] **Step 3: Write minimal implementation**

```js
<p className="muted budget-save-note">
  이번 달 자동 이월은 지난달 기준으로 한 번만 계산되고, 같은 달에는 저장된 값을 다시 사용합니다.
</p>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS.

