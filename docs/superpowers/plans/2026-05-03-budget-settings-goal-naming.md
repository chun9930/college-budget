# BudgetSettings 목표 명칭 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BudgetSettings의 목표 관련 명칭을 `예산 계산 설정`, `월 저축 계획`, `목표 계획 목록`으로 정리해 사용자 역할 구분을 명확히 한다.

**Architecture:** `BudgetSettings.jsx`의 탭 레이블과 섹션 제목/설명 문구만 바꾼다. `savingGoalSettings`와 `savingGoals`의 데이터 구조, 계산 로직, 저장 로직은 그대로 유지한다. 사용자 화면에 보이는 표현만 정리해 역할이 섞이지 않도록 한다.

**Tech Stack:** React, Vite, localStorage, React Testing Library, Vitest

---

### Task 1: BudgetSettings 명칭 정리

**Files:**
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/pages/BudgetSettings.test.jsx`
- Modify: `src/index.css` (필요 시 탭/설명 문구 간격 최소 조정)
- Modify: `README.md` (예산 설정 섹션 관련 문구만)
- Test: `src/pages/BudgetSettings.test.jsx`

- [ ] **Step 1: Write the failing test**

```tsx
// 탭 이름과 설명 문구가 새 명칭으로 렌더되는지 확인하는 테스트를 추가한다.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: 기존 탭/제목 문자열 검색이 있으면 실패.

- [ ] **Step 3: Write minimal implementation**

```tsx
// 탭 이름을 '예산 계산 설정' / '목표 계획 목록'으로 바꾸고,
// '목표 설정 카드'를 '월 저축 계획'으로 변경한다.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/BudgetSettings.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/BudgetSettings.jsx src/pages/BudgetSettings.test.jsx src/index.css README.md
git commit -m "fix: clarify budget settings goal naming"
```
