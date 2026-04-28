# Toss + Banksalad 하이브리드 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대학생 소비 판단 도구의 기능은 유지하면서, 홈/설정은 Toss형 미니멀 UI로, 기록/통계는 Banksalad형 수치 중심 UI로 재구성하고 캘린더 페이지를 추가한다.

**Architecture:** React + Vite SPA 구조를 유지한다. 기존 `pages/components/lib` 분리 원칙을 그대로 쓰되, 디자인 변경은 `index.css`의 공통 토큰과 각 페이지 레이아웃 조정을 중심으로 처리한다. 새 캘린더 페이지는 기존 지출 기록 데이터를 읽어 월간 요약과 날짜별 상세를 보여주는 전용 읽기 화면으로 만든다.

**Tech Stack:** React, Vite, JavaScript, HTML/CSS, Hash Router, localStorage, Vitest, React Testing Library

---

## 작업 순서

1. Header / BottomNav를 먼저 통일한다.
2. Home 페이지를 Toss 스타일로 단순화한다.
3. BudgetSettings를 여백 중심 구조로 수정한다.
4. ExpenseRecords 리스트 밀도를 높인다.
5. Statistics를 숫자 중심으로 재배치한다.
6. Calendar 페이지를 추가한다.

## 작업 기준

- 기존 기능 로직은 변경하지 않는다.
- UI 레이아웃만 수정한다.
- `index.css`에서 공통 토큰을 먼저 정의한다.
- 카드 개수는 최소화한다.
- 핵심 숫자를 먼저 노출한다.
- 모바일 기준을 유지한다.

### Task 1: 공통 디자인 토큰과 레이아웃 기준 정리

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/Header.jsx`
- Modify: `src/components/BottomNav.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import Header from './components/Header';

it('shows the brand name and shared navigation labels', () => {
  render(<Header currentUser={null} onLogout={() => {}} />);

  expect(screen.getByText('Pingo')).toBeInTheDocument();
  expect(screen.getByText('홈')).toBeInTheDocument();
  expect(screen.getByText('예산')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`

Expected: 공통 레이아웃과 토큰이 아직 정리되지 않아 스타일 기대값이 맞지 않는다.

- [ ] **Step 3: Write minimal implementation**

`index.css`에 다음 기준을 둔다.

```css
:root {
  --page-max-width: 1120px;
  --page-gap: 24px;
  --card-radius: 28px;
  --surface-border: #e8eef8;
  --surface-bg: #ffffff;
  --accent: #2f6bff;
  --text-main: #101828;
  --text-muted: #667085;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`

Expected: 헤더와 네비게이션이 같은 디자인 토큰을 공유한다.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/Header.jsx src/components/BottomNav.jsx
git commit -m "style: normalize shared layout tokens"
```

### Task 2: 홈과 예산 설정을 Toss형으로 정리

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/components/SummaryCard.jsx`
- Modify: `src/components/StatusBadge.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import Home from './pages/Home';

it('puts the daily budget at the top of the home screen', () => {
  render(
    <Home
      dailyBudget={25000}
      todaySpent={8000}
      alertState={{ key: 'caution', label: '주의', description: '주의 상태' }}
      alertDismissed={false}
      fixedExpenseTotal={100000}
      remainingDays={5}
      currentUser={null}
      onDismissAlert={() => {}}
    />
  );

  expect(screen.getByText('오늘 사용 가능 금액')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`

Expected: 홈과 예산 화면의 상단 구조가 아직 목표 형태가 아니다.

- [ ] **Step 3: Write minimal implementation**

홈은 큰 숫자 1개와 보조 숫자 2개 중심으로 정리하고, 예산 설정은 3카드 구조를 유지하되 카드 그림자와 여백을 줄인다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`

Expected: 홈의 핵심 수치가 상단에서 먼저 보인다.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/pages/BudgetSettings.jsx src/components/SummaryCard.jsx src/components/StatusBadge.jsx
git commit -m "style: simplify home and budget screens"
```

### Task 3: 지출 기록과 통계를 Banksalad형으로 정리

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/pages/Statistics.jsx`
- Modify: `src/components/EmptyState.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import Statistics from './pages/Statistics';

it('shows monthly total and top category first', () => {
  render(
    <Statistics
      expenseRecords={[
        { id: '1', amount: 10000, category: '식비', date: '2026-04-28T00:00:00.000Z' },
      ]}
    />
  );

  expect(screen.getByText('월 지출 요약')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`

Expected: 통계 화면이 아직 수치 중심 레이아웃으로 정리되지 않았다.

- [ ] **Step 3: Write minimal implementation**

지출 기록은 입력 폼과 목록의 간격을 줄이고, 통계는 숫자와 비율이 먼저 보이게 정리한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`

Expected: 지출 기록과 통계가 Banksalad형 정보 구조를 따른다.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ExpenseRecords.jsx src/pages/Statistics.jsx src/components/EmptyState.jsx
git commit -m "style: densify records and statistics screens"
```

### Task 4: 캘린더 페이지 추가

**Files:**
- Create: `src/pages/Calendar.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/BottomNav.jsx`
- Modify: `src/pages/ExpenseRecords.jsx`
- Create: `src/pages/Calendar.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import Calendar from './pages/Calendar';

it('renders calendar month summary and selected day details', () => {
  render(
    <Calendar
      expenseRecords={[
        { id: '1', amount: 12000, category: '식비', date: '2026-04-28T00:00:00.000Z' },
      ]}
    />
  );

  expect(screen.getByText('캘린더')).toBeInTheDocument();
  expect(screen.getByText('월간 지출 캘린더')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`

Expected: `/calendar` 경로와 캘린더 페이지가 아직 없다.

- [ ] **Step 3: Write minimal implementation**

`/calendar` 라우트를 추가하고, 지출 기록 데이터를 월간 그리드와 날짜별 상세로 보여주는 전용 페이지를 만든다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`

Expected: 캘린더 페이지가 지출 기록 데이터를 읽어 표시한다.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/BottomNav.jsx src/pages/Calendar.jsx src/pages/Calendar.test.jsx src/pages/ExpenseRecords.jsx
git commit -m "feat: add spending calendar page"
```

### Task 5: 문서와 접근성 마무리

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-28.md`

- [ ] **Step 1: Write the failing test**

```text
README.md에 실제 구현된 라우트와 페이지 목록이 아직 캘린더를 반영하지 않는다.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `git diff -- README.md`

Expected: 문서가 실제 구현과 어긋나는 부분이 있다.

- [ ] **Step 3: Write minimal implementation**

README에는 실제 구현된 경로와 화면만 적고, 일일 로그에는 오늘 변경한 항목과 검증 내용을 기록한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `git diff -- README.md daily-log/2026-04-28.md`

Expected: 문서가 실제 구현과 일치한다.

- [ ] **Step 5: Commit**

```bash
git add README.md daily-log/2026-04-28.md
git commit -m "docs: sync design and implementation notes"
```
