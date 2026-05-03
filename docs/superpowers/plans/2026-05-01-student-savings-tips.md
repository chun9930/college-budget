# 대학생 절약 팁 추가 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statistics 화면에 카테고리별 대학생 절약 팁을 연결해, 소비 패턴 분석 결과와 실천 행동을 함께 보여준다.

**Architecture:** `src/lib/budget.js`에 카테고리 기반 절약 팁 helper를 추가하고, `Statistics.jsx`는 기존 분석 결과 위에 맞춤 절약 팁 섹션을 렌더링한다. 예산 계산용 합계는 그대로 유지하고, 통계 표시용 집계만 사용한다.

**Tech Stack:** React, Vite, localStorage, Vitest, jsdom

---

### Task 1: 절약 팁 helper 추가

**Files:**
- Modify: `src/lib/budget.js`
- Test: `src/lib/budget.analysis.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { getCategorySpendingSummary, getStudentSavingsTips } from './budget';

describe('student savings tips helper', () => {
  it('returns general tips when there are not enough records', () => {
    const summary = getCategorySpendingSummary([], new Date('2026-05-01T09:00:00'));
    const tips = getStudentSavingsTips(summary, []);

    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0].title).toContain('절약 팁');
  });

  it('prioritizes category tips when one category is 40 percent or more', () => {
    const summary = getCategorySpendingSummary(
      [
        { date: '2026-05-01T09:00:00', amount: '52000', category: '식비' },
        { date: '2026-05-02T09:00:00', amount: '18000', category: '교통' },
        { date: '2026-05-03T09:00:00', amount: '30000', category: '식비' },
      ],
      new Date('2026-05-01T09:00:00')
    );

    const tips = getStudentSavingsTips(summary, []);
    expect(tips[0].category).toBe('식비');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/lib/budget.analysis.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL or Windows spawn EPERM.

- [ ] **Step 3: Write minimal implementation**

```js
export function getStudentSavingsTips(categorySummary, monthlyComparison) {
  // category-based tips + fallback general tips
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/lib/budget.analysis.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS, or same Windows limitation.

### Task 2: Statistics 화면 섹션 추가

**Files:**
- Modify: `src/pages/Statistics.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

```js
// Add a page-level test to assert that the "대학생 절약 팁" section renders,
// and that the text includes category, reason, and action.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/Statistics.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: FAIL before implementation or spawn EPERM.

- [ ] **Step 3: Write minimal implementation**

```jsx
// Render a new section after the personalized feedback cards:
// - category title
// - reason
// - practical action
// Keep the existing analysis cards intact.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/Statistics.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS, or same environment limitation.

### Task 3: Verification and documentation sync

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-05-01.md`

- [ ] **Step 1: Verify with build and Node checks**

```bash
npm.cmd exec -- esbuild src/lib/budget.js src/pages/Statistics.jsx --bundle --outdir=tmp-check
```

- [ ] **Step 2: Record verification limits**

```md
Vitest is blocked on Windows with spawn EPERM in this environment, so validation used esbuild and Node direct checks.
```

- [ ] **Step 3: Update docs**

```md
README and daily log should mention the new student savings tips section and its category-based guidance.
```

