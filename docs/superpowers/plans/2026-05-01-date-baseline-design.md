# 날짜 기준 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 전반의 날짜 기준을 `getToday()`/`currentDate`로 통일해 하루 지출, 월 지출, 남은 일수, 자동 이월, 정기지출 반영이 같은 날짜 기준으로 계산되게 한다.

**Architecture:** 날짜를 읽는 기준을 파일 상단의 고정 `new Date()`가 아니라 호출 시점의 `currentDate`로 통일한다. 공용 날짜 helper를 두고, `App.jsx`가 그 값을 받아 예산 계산과 화면 표시 props를 같은 기준으로 내려보낸다. 계산식은 유지하고 날짜 소스만 정리한다.

**Tech Stack:** React, Vite, localStorage, Vitest

---

### Task 1: 공용 날짜 기준 helper 정리

**Files:**
- Modify: `src/lib/budget.js`
- Modify: `src/lib/recurring.js`
- Modify: `src/lib/alert.js`
- Modify: `src/pages/Statistics.jsx`
- Modify: `src/pages/Calendar.jsx`

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, expect, it } from 'vitest';
import { getRemainingDaysIncludingToday } from './budget';

describe('getRemainingDaysIncludingToday', () => {
  it('counts remaining days from the supplied date, not file load time', () => {
    expect(getRemainingDaysIncludingToday(new Date('2026-04-10T09:00:00'))).toBe(21);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/lib/budget.test.js --environment node --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL if the helper still depends on a fixed module-level date.

- [ ] **Step 3: Write minimal implementation**

```javascript
export function getToday(now = new Date()) {
  const current = new Date(now);
  return new Date(current.getFullYear(), current.getMonth(), current.getDate());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/lib/budget.test.js --environment node --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

### Task 2: App 기준 날짜 주입 통일

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/pages/Statistics.jsx`

- [ ] **Step 1: Write the failing test**

```javascript
it('derives dailyBudget and remainingDays from the same currentDate', () => {
  const currentDate = new Date('2026-04-10T09:00:00');
  expect(getRemainingDaysIncludingToday(currentDate)).toBe(21);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL if any page still reads from a file-level fixed today value or uses an inconsistent baseline.

- [ ] **Step 3: Write minimal implementation**

```javascript
const currentDate = getToday();
const remainingDays = getRemainingDaysIncludingToday(currentDate);
const dailyBudget = calculateDailyBudget({ ... , remainingDays });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

### Task 3: 자동 이월 및 정기지출 날짜 기준 정리

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/lib/recurring.js`
- Modify: `src/pages/BudgetSettings.jsx`

- [ ] **Step 1: Write the failing test**

```javascript
it('reuses the same month key for carryover and recurring application', () => {
  const monthKey = getMonthKey(new Date('2026-05-01T09:00:00'));
  expect(monthKey).toBe('2026-05');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL if monthly snapshots or recurring application still diverge by date source.

- [ ] **Step 3: Write minimal implementation**

```javascript
const currentDate = getToday();
const currentMonthKey = getMonthKey(currentDate);
const autoCarryOver = getCarryOverForMonth(carryOverState, currentMonthKey);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

### Task 4: 검증 및 문서 정리

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-05-01.md`

- [ ] **Step 1: Run bundle validation**

Run: `npm.cmd exec -- esbuild src/App.jsx src/pages/Home.jsx src/pages/BudgetSettings.jsx src/pages/ExpenseRecords.jsx src/pages/Statistics.jsx src/lib/budget.js src/lib/recurring.js src/lib/alert.js --bundle --outdir=tmp-check`
Expected: build succeeds without syntax errors.

- [ ] **Step 2: Run browser/manual QA**

Check:
- Home, BudgetSettings, ExpenseRecords, Statistics all use the same current date baseline.
- 하루 지출, 이번 달 지출, 남은 일수, 자동 이월이 같은 날짜 기준으로 보인다.

- [ ] **Step 3: Update docs**

```markdown
- 날짜 계산 기준은 `currentDate`/`getToday()`를 사용한다.
- 자동 이월과 정기지출 반영은 같은 월 기준을 따른다.
```

- [ ] **Step 4: Record the work**

Write the daily log entry in `daily-log/2026-05-01.md`.
