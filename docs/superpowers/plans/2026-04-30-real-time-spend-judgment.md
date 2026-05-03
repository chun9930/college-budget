# 실시간 소비 가능 여부 판단 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈과 지출 기록 화면에서 같은 예산 기준으로 즉시 소비 판단을 보여주고, 저장 로직은 건드리지 않은 채 입력 단계의 판단 문구만 정리한다.

**Architecture:** `src/lib/alert.js`에 입력 판단용 helper를 추가해 홈과 지출 입력이 같은 판단 기준을 공유한다. `Home.jsx`는 기존 즉시 소비 판단 구조를 유지하고, `ExpenseRecords.jsx`는 금액 입력 아래에 저장 전 판단 문구를 표시한다. 계산값은 기존 `dailyBudget`, `todaySpent`를 기준으로만 사용하고, 저장/수정 로직은 변경하지 않는다.

**Tech Stack:** React, Vite, localStorage, Vitest, CSS Modules 없음(전역 CSS)

---

### Task 1: 입력 판단 helper 추가

**Files:**
- Modify: `src/lib/alert.js`
- Test: `src/pages/ExpenseRecords.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
import { getExpensePreviewSnapshot } from '../lib/alert';

it('returns a spend preview message for valid amount input', () => {
  const snapshot = getExpensePreviewSnapshot({
    hasBudgetSetup: true,
    dailyBudget: 50000,
    todaySpent: 12000,
    inputAmount: 4200,
  });

  expect(snapshot.statusKey).toBe('safe');
  expect(snapshot.message).toContain('더 쓸 수 있어요');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/ExpenseRecords.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL because `getExpensePreviewSnapshot` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function getExpensePreviewSnapshot({
  hasBudgetSetup = false,
  dailyBudget = 0,
  todaySpent = 0,
  inputAmount = 0,
} = {}) {
  // ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/ExpenseRecords.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS.

### Task 2: ExpenseRecords 입력 판단 연결

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/index.css`
- Test: `src/pages/ExpenseRecords.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
it('shows a spend preview message under the amount field', () => {
  renderExpenseRecords(<ExpenseRecords {...baseProps} />);

  fireEvent.change(screen.getByLabelText('금액'), { target: { value: '4200' } });

  expect(screen.getByText('이 지출을 추가하면 오늘 33,800원을 더 쓸 수 있어요')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/ExpenseRecords.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL because the helper is not wired into the component yet.

- [ ] **Step 3: Write minimal implementation**

```js
import { getExpensePreviewSnapshot } from '../lib/alert';
// ...
const spendPreview = getExpensePreviewSnapshot({ hasBudgetSetup: Boolean(dailyBudget), dailyBudget, todaySpent, inputAmount: recordForm.amount });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/ExpenseRecords.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS.

### Task 3: Smoke verification

**Files:**
- Modify: none
- Test: `src/pages/Home.test.jsx`, `src/App.test.jsx`, `src/pages/ExpenseRecords.test.jsx`

- [ ] **Step 1: Run the focused test set**

Run: `npm.cmd exec -- vitest run src/pages/Home.test.jsx src/pages/ExpenseRecords.test.jsx src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: either pass or surface one bounded issue to fix.

- [ ] **Step 2: Confirm browser-visible copy**

Manual check:
- Home still shows the same judgment headline.
- ExpenseRecords amount field shows the inline judgment message.
- Save behavior and edit/delete behavior remain unchanged.

