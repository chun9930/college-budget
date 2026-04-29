# Expense Records Internal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ExpenseRecords` 화면을 `일반 지출 기록`과 `정기지출 관리` 두 개의 내부 페이지로 나눠, 각 영역이 독립적으로 읽히고 조작되게 한다.

**Architecture:** 하나의 `#/expense-records` 라우트 안에서 `activeExpensePage` 상태로 내부 페이지를 전환한다. 일반 지출 페이지에는 선택 날짜, 월 요약, 입력 폼, 일반 지출 목록, 최근 기록이 들어가고, 정기지출 페이지에는 정기지출 합계, 입력 폼, 정기지출 목록만 들어간다. 저장/수정/삭제, 최근 기록 자동 입력, 선택 날짜 기반 저장, 카테고리 분리 로직은 그대로 유지하고 렌더링 구조만 바꾼다.

**Tech Stack:** React, React Router, existing local state, existing CSS utility classes, Vitest, Testing Library

---

### Task 1: 내부 페이지 전환 상태와 렌더 구조 정리

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`

- [ ] **Step 1: Write the failing test**

Add a test that renders `ExpenseRecords` and verifies that:
1. the default internal page is `일반 지출 기록`
2. switching to `정기지출 관리` hides the general expense form/list and shows the recurring expense form/list
3. switching back restores the general expense page

```jsx
it('switches between general expense and recurring expense internal pages', () => {
  renderExpenseRecords(<ExpenseRecords {...baseProps} />);

  expect(screen.getByRole('button', { name: '일반 지출 기록' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: '일반 지출 기록' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '정기지출 관리' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '정기지출 관리' }));

  expect(screen.getByRole('button', { name: '정기지출 관리' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: '정기지출 관리' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '지출 기록' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '일반 지출 기록' }));

  expect(screen.getByRole('heading', { name: '지출 기록' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false --runInBand`
Expected: fail because the internal page switch buttons/state do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a local `activeExpensePage` state in `ExpenseRecords.jsx` and render two mutually exclusive branches:

```jsx
const [activeExpensePage, setActiveExpensePage] = useState('general');
```

```jsx
<div className="expense-page-tabs" role="tablist" aria-label="지출 기록 내부 페이지">
  <button
    type="button"
    role="tab"
    aria-selected={activeExpensePage === 'general'}
    className={`expense-page-tab ${activeExpensePage === 'general' ? 'is-active' : ''}`}
    onClick={() => setActiveExpensePage('general')}
  >
    일반 지출 기록
  </button>
  <button
    type="button"
    role="tab"
    aria-selected={activeExpensePage === 'recurring'}
    className={`expense-page-tab ${activeExpensePage === 'recurring' ? 'is-active' : ''}`}
    onClick={() => setActiveExpensePage('recurring')}
  >
    정기지출 관리
  </button>
</div>
```

Render only the selected branch:

```jsx
{activeExpensePage === 'general' ? (
  <ExpenseSection title="일반 지출 기록" ...>
    {/* selected date, month summary, expense form, expense list, recent records */}
  </ExpenseSection>
) : (
  <ExpenseSection title="정기지출 관리" ...>
    {/* recurring total, recurring form, recurring list */}
  </ExpenseSection>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false --runInBand`
Expected: PASS for the new page-switch behavior and existing expense flows.

- [ ] **Step 5: Commit**

Do not commit in this session unless the user explicitly approves it.

### Task 2: Internal page styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

Use the page-switch test from Task 1 as the behavioral proof; no separate CSS-only test is required.

- [ ] **Step 2: Run test to verify it fails**

Run the Task 1 test command and confirm the layout classes are not styled yet.

- [ ] **Step 3: Write minimal implementation**

Add compact styles for the page tabs and internal page wrapper:

```css
.expense-page-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.expense-page-tab {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-main);
  font-weight: 700;
}

.expense-page-tab.is-active {
  border-color: #7ccf8a;
  background: #edf9ef;
  color: #1f7a3f;
}

.expense-page-panel {
  display: grid;
  gap: 18px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run the same Vitest command and confirm the UI still renders correctly.

- [ ] **Step 5: Commit**

Do not commit in this session unless the user explicitly approves it.

### Task 3: Documentation sync

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-29.md`

- [ ] **Step 1: Write the failing test**

No automated test required; verify the relevant README section text against the new internal page structure.

- [ ] **Step 2: Run test to verify it fails**

Not applicable; this is documentation only.

- [ ] **Step 3: Write minimal implementation**

Update only the `지출 기록` and `UI 구조 원칙` sections to explain that the page now has two internal views:

```markdown
- 지출 기록 페이지는 `일반 지출 기록`과 `정기지출 관리` 두 내부 페이지로 나뉜다.
- 일반 지출 기록은 선택 날짜, 월 요약, 입력 폼, 목록, 최근 기록을 보여 준다.
- 정기지출 관리는 정기지출 합계, 입력 폼, 목록을 보여 준다.
```

Append a Korean daily log entry with:
1. 오늘 한 일
2. 다음에 해야할 일
3. 깃허브 푸시기록

- [ ] **Step 4: Run test to verify it passes**

Manually verify that README only changed in the relevant sections and that the daily log was appended.

- [ ] **Step 5: Commit**

Do not commit in this session unless the user explicitly approves it.

## Self-Review

- Spec coverage: page switch UI, isolated internal pages, styles, docs sync.
- Placeholder scan: none left in the concrete implementation steps.
- Type consistency: the new state name is `activeExpensePage` across tasks.
- Scope check: focused on screen organization only; no logic changes.
