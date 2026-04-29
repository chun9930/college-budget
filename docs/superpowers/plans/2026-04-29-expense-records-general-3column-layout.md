# ExpenseRecords General Layout 3-Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 지출 기록 영역을 데스크톱 3열, 태블릿 2열, 모바일 1열로 재배치한다.

**Architecture:** `ExpenseRecords.jsx`의 일반 지출 내부 페이지에서 입력 폼, 일반 지출 목록, 최근 기록 빠른 입력을 서로 독립된 카드로 렌더링한다. 정기지출 관리 영역은 기존 구조를 유지하고, 공통 스타일은 `src/index.css`의 그리드 반응형 규칙으로만 조정한다.

**Tech Stack:** React, Vite, CSS Grid, `@testing-library/react`, Vitest

---

### Task 1: 일반 지출 내부 페이지 구조 재배치

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`

- [ ] **Step 1: 일반 지출 카드 구조 확인**

```jsx
<div className="grid-2 expense-section__grid">
  <form className="card form-grid" onSubmit={saveExpense}>...</form>
  <div className="expense-section__stack">
    <section className="card stack">일반 지출 기록 목록</section>
    <section className="card stack">최근 기록으로 빠른 입력</section>
  </div>
</div>
```

- [ ] **Step 2: 3개 카드로 분리**

```jsx
<div className="expense-section__grid expense-section__grid--general">
  <form className="card form-grid" onSubmit={saveExpense}>...</form>
  <section className="card stack">일반 지출 기록 목록</section>
  <section className="card stack">최근 기록으로 빠른 입력</section>
</div>
```

- [ ] **Step 3: 정기지출 영역은 그대로 유지**

```jsx
<div className="grid-2 expense-section__grid">
  <form className="card form-grid" onSubmit={saveRecurring}>...</form>
  <section className="card stack">정기지출 목록</section>
</div>
```

### Task 2: 3열/2열/1열 반응형 CSS 정리

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 일반 지출 3열 그리드 추가**

```css
.expense-section__grid--general {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}
```

- [ ] **Step 2: 900px 이하에서 2열 또는 1열로 축소**

```css
@media (max-width: 900px) {
  .expense-section__grid--general {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 3: 640px 이하에서 1열 고정**

```css
@media (max-width: 640px) {
  .expense-section__grid--general {
    grid-template-columns: 1fr;
  }
}
```

### Task 3: 렌더링 확인 테스트

**Files:**
- Modify: `src/pages/ExpenseRecords.test.jsx`

- [ ] **Step 1: 일반 지출 카드 3개가 분리되어 보이는지 테스트**

```jsx
expect(screen.getByRole('heading', { name: '지출 기록' })).toBeInTheDocument();
expect(screen.getByRole('heading', { name: '일반 지출 기록' })).toBeInTheDocument();
expect(screen.getByRole('heading', { name: '일반 지출 기록 목록' })).toBeInTheDocument();
expect(screen.getByRole('heading', { name: '최근 기록으로 빠른 입력' })).toBeInTheDocument();
```

- [ ] **Step 2: 정기지출 영역은 기존 그대로 유지되는지 확인**

```jsx
expect(screen.getByRole('heading', { name: '정기지출 관리' })).toBeInTheDocument();
expect(screen.getByRole('heading', { name: '정기지출 목록' })).toBeInTheDocument();
```

## Self-Review

### 1. Spec coverage
- 일반 지출 입력 폼: Task 1
- 일반 지출 기록 목록: Task 1
- 최근 기록으로 빠른 입력: Task 1
- 데스크톱 3열: Task 2
- 900px 이하 2열/1열: Task 2
- 640px 이하 1열: Task 2
- 기능 유지: Task 1, Task 3

### 2. Placeholder scan
- No placeholders like TBD/TODO remain.

### 3. Type consistency
- `expense-section__grid--general` only applies to the general expense page layout.
- Existing `expense-section__grid` remains for the recurring page.
