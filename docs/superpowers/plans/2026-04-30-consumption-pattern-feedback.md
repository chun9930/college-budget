# 소비 패턴 분석과 개인화 피드백 강화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statistics 화면에 카테고리 비중, 전월 대비 변화, 과소비 가능성 피드백을 추가해 소비 패턴을 더 구체적으로 보여준다.

**Architecture:** `src/lib/budget.js`에 분석용 helper를 추가해 월별/카테고리별 합계와 전월 비교를 한 번에 계산한다. `Statistics.jsx`는 이 helper 결과를 받아 카드형 피드백과 카테고리 요약을 렌더링하고, 예산 계산용 합계와 표시용 합계는 기존 기준을 유지한다.

**Tech Stack:** React, Vite, localStorage, Vitest, jsdom

---

### Task 1: 분석 helper 추가

**Files:**
- Modify: `src/lib/budget.js`
- Test: `src/lib/budget.analysis.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { getCategorySpendingSummary, getMonthlySpendingComparison } from './budget';

describe('spending analysis helpers', () => {
  it('returns safe zeros when there are no records', () => {
    const summary = getCategorySpendingSummary([], new Date('2026-04-30T09:00:00'));

    expect(summary.monthlyTotal).toBe(0);
    expect(summary.categoryEntries).toEqual([]);
    expect(summary.topCategory).toEqual(['기타', 0]);
  });

  it('flags categories above 40 percent', () => {
    const summary = getCategorySpendingSummary(
      [
        { date: '2026-04-10T09:00:00', amount: '52000', category: '식비' },
        { date: '2026-04-11T09:00:00', amount: '18000', category: '교통' },
        { date: '2026-04-12T09:00:00', amount: '30000', category: '식비' },
      ],
      new Date('2026-04-30T09:00:00')
    );

    expect(summary.topCategory[0]).toBe('식비');
    expect(summary.topCategoryRatio).toBeGreaterThanOrEqual(40);
  });

  it('compares current month with previous month', () => {
    const comparison = getMonthlySpendingComparison(
      [
        { date: '2026-03-10T09:00:00', amount: '10000', category: '카페' },
        { date: '2026-04-10T09:00:00', amount: '20000', category: '카페' },
      ],
      new Date('2026-04-30T09:00:00')
    );

    expect(comparison.currentMonthTotal).toBe(20000);
    expect(comparison.previousMonthTotal).toBe(10000);
    expect(comparison.changeAmount).toBe(10000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/lib/budget.analysis.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL or environment error before implementation.

- [ ] **Step 3: Write minimal implementation**

```js
export function getCategorySpendingSummary(expenseRecords = [], today = new Date(), options = {}) {
  // current month summary, ratio, top category, threshold flags
}

export function getMonthlySpendingComparison(expenseRecords = [], today = new Date(), options = {}) {
  // compare current month and previous month totals by category
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/lib/budget.analysis.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS, or same Windows spawn limitation if environment blocks Vitest.

### Task 2: Statistics 화면 피드백 강화

**Files:**
- Modify: `src/pages/Statistics.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

```js
// If adding a page test is feasible, assert that the top category card and
// overspending feedback render with category name, ratio, and amount.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/Statistics.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL before implementation or spawn EPERM in this environment.

- [ ] **Step 3: Write minimal implementation**

```jsx
// Use analysis helper results to render:
// - current month summary
// - top category card
// - overspending feedback cards
// - month-over-month comparison
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/Statistics.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS, or same environment limitation.

### Task 3: Verification and documentation sync

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-30.md`

- [ ] **Step 1: Verify the summary output**

```bash
npm.cmd exec -- esbuild src/lib/budget.js src/pages/Statistics.jsx --bundle --outdir=tmp-check
```

- [ ] **Step 2: Record limitations if Vitest is blocked**

```md
Vitest is blocked on Windows with spawn EPERM in this environment, so validation used esbuild and Node direct checks.
```

- [ ] **Step 3: Update docs**

```md
README and daily log should mention the new consumption pattern analysis summary and any verification limits.
```

