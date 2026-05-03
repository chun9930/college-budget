# localStorage 데이터 구조 점검 및 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 localStorage 데이터를 삭제하지 않고, 새 필드와 기존 키를 함께 안전하게 읽고 저장하도록 저장 구조를 정규화한다.

**Architecture:** `src/lib/storage.js`에 정규화 함수를 모아 legacy/seed/계정 스냅샷 입력을 한 번에 보정한다. `App.jsx`는 원본 localStorage를 직접 해석하지 않고 정규화된 값만 사용하며, `seedData`와 계정 스냅샷은 최신 필드를 포함하도록 맞춘다.

**Tech Stack:** React + Vite, localStorage, Vitest, Node 직접 검증

---

### Task 1: 저장 키 정규화 함수 추가

**Files:**
- Modify: `src/lib/storage.js`
- Test: `src/lib/seedData.test.js`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
it('normalizes missing storage fields without breaking existing values', () => {
  const normalized = normalizeStoredAccountSnapshot({
    monthlyIncome: 1200000,
    budgetSettings: { fixedExpenseAmount: '5000' },
    recurringExpenses: [{ id: 'r1', amount: '10000' }],
    expenseRecords: [{ id: 'e1', amount: '2000' }],
  });

  expect(normalized.monthlyIncome).toBe(1200000);
  expect(normalized.budgetSettings.fixedExpenseAmount).toBe('5000');
  expect(normalized.savingGoals).toEqual([]);
  expect(normalized.carryOverState).toEqual({
    lastCalculatedMonth: '',
    monthlySnapshots: {},
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/lib/seedData.test.js src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: fails because the new normalize helpers are not exported yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function normalizeStoredBudgetSettings(value) {
  return {
    ...DEFAULT_BUDGET_SETTINGS,
    ...(value && typeof value === 'object' ? value : {}),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/lib/seedData.test.js src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: passes for the normalization assertions.

### Task 2: alertHistory / notificationHistory 호환 정리

**Files:**
- Modify: `src/lib/storage.js`
- Modify: `src/App.jsx`
- Test: `src/lib/seedData.test.js`

- [ ] **Step 1: Write the failing test**

```js
it('merges notificationHistory into alertHistory without duplication', () => {
  saveJSON(KEYS.alertHistory, [{ id: 'a1', message: '기존 알림', read: false }]);
  saveJSON('notificationHistory', [{ id: 'n1', message: '옛 알림', read: false }]);

  const normalized = normalizeStoredAccountSnapshot({
    alertHistory: loadJSON(KEYS.alertHistory, []),
    notificationHistory: loadJSON('notificationHistory', []),
  });

  expect(normalized.alertHistory).toHaveLength(2);
  expect(normalized.alertHistory.map((item) => item.id)).toEqual(['a1', 'n1']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/lib/seedData.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: fails until alias merge logic exists.

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeNotificationHistory(alertHistoryValue, notificationHistoryValue) {
  const alertHistory = Array.isArray(alertHistoryValue) ? alertHistoryValue : [];
  const notificationHistory = Array.isArray(notificationHistoryValue) ? notificationHistoryValue : [];
  const merged = [...alertHistory];
  notificationHistory.forEach((item) => {
    if (!merged.some((existing) => existing.id === item.id)) {
      merged.push(item);
    }
  });
  return merged;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/lib/seedData.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: passes for alias merge assertions.

### Task 3: App boot normalization and snapshot update

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/lib/storage.js`
- Modify: `src/lib/seedData.js`
- Test: `src/App.test.jsx`
- Test: `src/lib/seedData.test.js`

- [ ] **Step 1: Write the failing test**

```js
it('keeps legacy values while filling missing snapshot fields', () => {
  const snapshot = normalizeStoredAccountSnapshot({
    monthlyIncome: 2000000,
    budgetSettings: { fixedExpenseAmount: '0' },
    savingGoalSettings: { goalAmount: '1000000' },
  });

  expect(snapshot.expenseRecords).toEqual([]);
  expect(snapshot.recurringExpenses).toEqual([]);
  expect(snapshot.savingGoals).toEqual([]);
  expect(snapshot.alertHistory).toEqual([]);
  expect(snapshot.carryOverState.lastCalculatedMonth).toBe('');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx src/lib/seedData.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: fails until App consumes normalized snapshot only.

- [ ] **Step 3: Write minimal implementation**

```js
const normalizedSnapshot = normalizeStoredAccountSnapshot(loadAccountSnapshot(email));
setExpenseRecords(normalizedSnapshot.expenseRecords);
setRecurringExpenses(normalizedSnapshot.recurringExpenses);
setSavingGoals(normalizedSnapshot.savingGoals);
setCarryOverState(normalizedSnapshot.carryOverState);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx src/lib/seedData.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: passes and existing auth/budget tests remain green.

### Task 4: Document storage compatibility

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-05-01.md`

- [ ] **Step 1: Write the failing test**

```js
expect(true).toBe(true);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: no code failure; this step is for documentation-only changes and can be skipped if tests are unchanged.

- [ ] **Step 3: Write minimal implementation**

```md
- localStorage 호환 키: `alertHistory` / `notificationHistory`
- 계정 스냅샷은 누락 필드를 안전한 기본값으로 보정한다
- `currentDate`는 저장하지 않는다
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx src/lib/seedData.test.js --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: existing tests remain green.

