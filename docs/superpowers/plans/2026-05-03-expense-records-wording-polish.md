# ExpenseRecords 문구 다듬기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ExpenseRecords 화면의 일반 지출 / 정기지출 설명 문구를 더 자연스럽게 다듬고, 자동 정기지출 표시가 의미상 구분되도록 유지한다.

**Architecture:** 기존 ExpenseRecords 구조와 데이터 흐름은 그대로 둔다. 화면 상단 안내, 일반 지출 설명, 정기지출 설명, 자동 정기지출 배지를 모두 문구 수준에서만 정리한다. README는 변경된 사용자 문구를 반영하는 관련 섹션만 최소 갱신한다.

**Tech Stack:** React, Vite, localStorage, React Testing Library, Vitest

---

### Task 1: ExpenseRecords 문구 정리

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/index.css` (필요 시 문구 줄바꿈/간격만 최소 조정)
- Test: `src/pages/ExpenseRecords.test.jsx` (필요 시 문구 검색/렌더 확인 보강)

- [ ] **Step 1: Write the failing test**

```tsx
// 문구 렌더가 자연스럽게 바뀌었는지 확인하는 최소 테스트를 추가한다.
// 예: 일반 지출/정기지출 설명 문자열이 화면에 렌더되는지 확인한다.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec -- vitest run src/pages/ExpenseRecords.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: 기존 문구 검색이 있으면 실패 또는 경고.

- [ ] **Step 3: Write minimal implementation**

```tsx
// ExpenseRecords의 설명 문자열을 더 자연스러운 한국어로 교체한다.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec -- vitest run src/pages/ExpenseRecords.test.jsx --environment jsdom --pool=threads --poolOptions.threads.singleThread`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/ExpenseRecords.jsx src/index.css src/pages/ExpenseRecords.test.jsx
git commit -m "fix: improve expense records wording"
```
