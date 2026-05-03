# Work Income Mode And Recurring Auto Inclusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BudgetSettings에서 월수입 입력 방식을 직접 입력과 근무 조건 계산으로 나누고, 정기지출 합계를 고정지출 계산에 자동 포함하는 토글을 추가한다.

**Architecture:** 기존 `monthlyIncome` 저장값과 `calculateDailyBudget()` 호출 구조는 유지한다. `budgetSettings`에 입력 모드와 근무 조건 원본, 정기지출 자동 포함 토글을 추가하고, 저장 시 근무 조건 모드이면 계산된 예상 월수입을 `monthlyIncome`으로 저장한다. `App.jsx`에서는 저장된 토글에 따라 `fixedExpenseTotal`만 분기한다.

**Tech Stack:** React, Vite, localStorage, Vitest, React Testing Library

---

### Task 1: BudgetSettings 테스트 추가

**Files:**
- Modify: `src/pages/BudgetSettings.test.jsx`

- [ ] 근무 조건 계산 모드에서 시급, 하루 근무시간, 주 근무일수를 입력하면 `monthlyIncome`이 계산된 값으로 저장되는 테스트를 추가한다.
- [ ] 정기지출 자동 반영 토글이 켜지면 `정기지출 합계 불러오기` 버튼이 비활성화되는 테스트를 추가한다.
- [ ] 직접 입력 모드에서는 기존 월수입 필드가 그대로 저장되는 테스트를 기존 테스트 기대값으로 유지한다.

### Task 2: BudgetSettings 구현

**Files:**
- Modify: `src/pages/BudgetSettings.jsx`

- [ ] `DEFAULT_FORM`에 `incomeMode`, `hourlyWage`, `workHoursPerDay`, `workDaysPerWeek`, `autoIncludeRecurringExpenses`를 추가한다.
- [ ] `buildValidationMap()`에 근무 조건 필드 검증을 추가한다.
- [ ] 직접 입력 / 근무 조건 계산 버튼 그룹을 추가한다.
- [ ] 근무 조건 계산 모드에서 예상 월수입을 표시하고 저장 시 계산값을 넘긴다.
- [ ] 정기지출 자동 반영 토글을 추가하고, ON이면 합계 불러오기 버튼을 비활성화한다.

### Task 3: App 계산 호출부 구현

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

- [ ] `DEFAULT_BUDGET_SETTINGS`에 새 필드를 추가한다.
- [ ] `recurringMonthlyTotal`을 다시 계산하고 `autoIncludeRecurringExpenses`가 true일 때만 `fixedExpenseTotal`에 더한다.
- [ ] 자동 반영 ON/OFF 계산 테스트를 추가한다.

### Task 4: 문서와 검증

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-30.md`

- [ ] README의 예산 설정/계산 로직 설명에 근무 조건 월수입과 정기지출 자동 반영 기준을 추가한다.
- [ ] 관련 Vitest와 esbuild 검증을 실행한다.
- [ ] 일일 로그를 누적 기록한다.
