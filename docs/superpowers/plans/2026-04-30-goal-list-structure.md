# 목표 목록 구조 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 단일 목표 계산을 유지하면서 `savingGoals` 배열로 여러 목표를 등록·수정·삭제하고, 목표 기반 재무 계획을 카드 목록으로 보여준다.

**Architecture:** `savingGoalSettings`는 예산 계산용 단일 목표로 그대로 두고, `savingGoals`는 목록형 목표 관리 데이터로 별도 저장한다. `App.jsx`가 두 구조를 모두 로드/저장하되, 예산 계산은 기존 단일 목표만 사용한다. `BudgetSettings.jsx`는 기존 단일 목표 UI 아래에 목표 목록을 추가하고, `MyPage.jsx`는 저장된 목표 목록을 요약 표시만 한다.

**Tech Stack:** React, Vite, localStorage, Vitest, Testing Library

---

### Task 1: 목표 데이터 모델과 계산 helper 추가

**Files:**
- Modify: `src/lib/budget.js`
- Modify: `src/lib/storage.js`
- Modify: `src/lib/seedData.js`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
expect(calculateSavingGoalListSummary([
  {
    id: 'goal-1',
    name: '여행 자금',
    category: '여행',
    targetAmount: '1000000',
    currentAmount: '250000',
    deadline: '2026-08-31',
  },
])).toMatchObject([
  {
    remainingAmount: 750000,
    achievementRate: 25,
  },
]);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: helper is missing or assertion fails for `savingGoals`.

- [ ] **Step 3: Write minimal implementation**

```js
export function calculateSavingGoalListSummary(goals = []) {
  return goals.map((goal) => ({
    ...goal,
    remainingAmount: Math.max(0, toNumber(goal.targetAmount) - toNumber(goal.currentAmount)),
    remainingDays: Math.max(0, differenceInDays(goal.deadline)),
    monthlyNeed: ...,
    dailyNeed: ...,
    achievementRate: ...,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

---

### Task 2: App 저장/복원 흐름에 savingGoals 연결

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/lib/storage.js`
- Modify: `src/lib/seedData.js`
- Modify: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

```js
expect(loadJSON(KEYS.savingGoals, [])).toEqual([
  {
    id: 'goal-1',
    name: '여행 자금',
    category: '여행',
    targetAmount: '1000000',
    currentAmount: '250000',
    deadline: '2026-08-31',
  },
]);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: `KEYS.savingGoals` is not yet wired.

- [ ] **Step 3: Write minimal implementation**

```js
const [savingGoals, setSavingGoals] = useState(() =>
  loadSeededServiceValue(initialAccountEmail, KEYS.savingGoals, [])
);

useEffect(() => {
  saveJSON(KEYS.savingGoals, savingGoals);
}, [savingGoals]);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm.cmd exec -- vitest run src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

---

### Task 3: BudgetSettings 목표 목록 UI 추가

**Files:**
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/pages/BudgetSettings.test.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

```js
expect(screen.getByText('목표 기반 재무 계획')).toBeInTheDocument();
expect(screen.getByRole('button', { name: '목표 추가' })).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: 목표 목록 UI가 아직 없음.

- [ ] **Step 3: Write minimal implementation**

```jsx
const goalCards = calculateSavingGoalListSummary(savingGoals);

{goalCards.map((goal) => (
  <article key={goal.id} className="card stack">
    <h3>{goal.name}</h3>
    <p>{goal.category}</p>
    <p>{goal.remainingAmount.toLocaleString()}원 남음</p>
  </article>
))}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

---

### Task 4: MyPage 요약과 README / 로그 정리

**Files:**
- Modify: `src/pages/MyPage.jsx`
- Modify: `README.md`
- Modify: `daily-log/2026-04-30.md`

- [ ] **Step 1: Write the failing test**

```js
expect(screen.getByText('목표 기반 재무 계획')).toBeInTheDocument();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: summary text missing.

- [ ] **Step 3: Write minimal implementation**

```jsx
<SummaryCard title="목표 기반 재무 계획" value={`${savingGoals.length}개`} note="여러 목표를 관리합니다." />
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx src/App.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

