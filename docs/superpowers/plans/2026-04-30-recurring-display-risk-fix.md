# 정기지출 표시 기준 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자동 반영 ON/OFF에 따른 예산 계산 기준과 기록/통계 화면의 표시 기준 차이를 사용자에게 명확히 보여준다.

**Architecture:** `App.jsx`에서 이미 분리된 예산 계산용 합계를 유지하고, `Statistics.jsx`는 기록 합계를 그대로 보여주되 보조 문구로 중복 제외 기준을 안내한다. Home과 BudgetSettings는 동일한 derived value를 계속 사용해 계산 기준을 일치시킨다.

**Tech Stack:** React, Vite, localStorage, Testing Library, Vitest

---

### Task 1: 통계 화면 안내 문구 정리

**Files:**
- Modify: `src/pages/Statistics.jsx`

- [ ] **Step 1: Add note for auto recurring exclusion**

```jsx
const hasAutoRecurringRecords = expenseRecords.some((record) => record.sourceRecurringId);

{hasAutoRecurringRecords ? (
  <p className="muted statistics-note">
    자동 반영된 정기지출은 예산 계산에서 중복 제외됩니다.
  </p>
) : null}
```

- [ ] **Step 2: Keep existing totals unchanged**

```jsx
// existing monthlyTotal / dailyEntries / categoryEntries logic remains unchanged
```

- [ ] **Step 3: Verify browser text**

Run: `npm.cmd exec -- vitest run src/App.test.jsx src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

### Task 2: Documentation sync

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update display guidance**

```md
- 자동 반영 ON일 때 예산 계산용 합계와 화면 표시용 합계는 분리해 사용합니다.
- 통계 화면에는 자동 반영된 정기지출이 예산 계산에서 중복 제외된다는 안내 문구를 표시합니다.
```

- [ ] **Step 2: Verify markdown consistency**

Run: inspect updated sections manually
Expected: only relevant sections changed
