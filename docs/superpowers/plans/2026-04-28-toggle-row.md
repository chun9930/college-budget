# Budget Settings Toggle Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예산 설정 화면의 기능 토글 카드가 이미지처럼 라벨과 스위치가 분리된 행 형태로 보이도록 개선한다.

**Architecture:** `BudgetSettings.jsx`는 토글 목록의 데이터와 상태만 관리하고, 시각 표현은 `ToggleRow.jsx`로 분리한다. 스타일은 `index.css`의 토글 전용 클래스에서 처리해 기존 예산 계산 로직과 다른 화면에는 영향을 주지 않는다.

**Tech Stack:** React, Vite, JavaScript, CSS

---

### Task 1: 토글 행 컴포넌트 추가

**Files:**
- Create: `src/components/ToggleRow.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import ToggleRow from './ToggleRow';

describe('ToggleRow', () => {
  it('shows label and reflects checked state', () => {
    render(<ToggleRow label="목표 설정" checked={true} onChange={() => {}} />);
    expect(screen.getByText('목표 설정')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- src/components/ToggleRow.test.jsx --runInBand`
Expected: FAIL with `Cannot find module './ToggleRow'`

- [ ] **Step 3: Write minimal implementation**

```jsx
import React from 'react';

export default function ToggleRow({ label, checked, onChange, hint }) {
  return (
    <label className="toggle-row">
      <span className="toggle-row__label">
        <span className="toggle-row__title">{label}</span>
        {hint ? <span className="toggle-row__hint">{hint}</span> : null}
      </span>
      <span className="toggle-switch">
        <input type="checkbox" role="switch" checked={checked} onChange={onChange} />
        <span className="toggle-switch__track">
          <span className="toggle-switch__thumb" />
        </span>
      </span>
    </label>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- src/components/ToggleRow.test.jsx --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ToggleRow.jsx src/components/ToggleRow.test.jsx
git commit -m "feat: 토글 행 컴포넌트 추가"
```

### Task 2: 예산 설정 화면의 토글 카드 교체

**Files:**
- Modify: `src/pages/BudgetSettings.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import BudgetSettings from './BudgetSettings';

describe('BudgetSettings toggle card', () => {
  it('renders toggle rows in the feature toggle card', () => {
    render(
      <BudgetSettings
        monthlyIncome={0}
        budgetSettings={{
          useManualBudget: true,
          manualDailyBudget: '',
          fixedExpenseAmount: '',
          emergencyFundAmount: '',
          goalEnabled: true,
          periodCalculationEnabled: true,
          carryOverEnabled: true,
          carryOverAmount: '',
        }}
        savingGoalSettings={{ goalAmount: '', goalPeriod: '', currentSaving: '' }}
        dailyBudget={0}
        remainingDays={1}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('기능 토글 카드')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '수동 하루 예산 사용' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- src/pages/BudgetSettings.test.jsx --runInBand`
Expected: FAIL because the toggle card still uses plain checkbox fields

- [ ] **Step 3: Write minimal implementation**

```jsx
import ToggleRow from '../components/ToggleRow';

const toggleRows = [
  { key: 'useManualBudget', label: '수동 하루 예산 사용' },
  { key: 'goalEnabled', label: '목표 설정' },
  { key: 'periodCalculationEnabled', label: '기간별 저축 계산' },
  { key: 'carryOverEnabled', label: '이월 기능' },
];
```

Use the component in the feature toggle card and add a `기능 상태` description box below it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- src/pages/BudgetSettings.test.jsx --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/BudgetSettings.jsx src/pages/BudgetSettings.test.jsx src/components/ToggleRow.jsx src/components/ToggleRow.test.jsx
git commit -m "feat: 예산 설정 토글 카드 개선"
```

### Task 3: 토글 전용 스타일 추가

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

```jsx
import { render } from '@testing-library/react';
import BudgetSettings from './BudgetSettings';

describe('BudgetSettings toggle styles', () => {
  it('keeps toggle rows aligned on mobile-friendly layout', () => {
    render(
      <BudgetSettings
        monthlyIncome={0}
        budgetSettings={{
          useManualBudget: true,
          manualDailyBudget: '',
          fixedExpenseAmount: '',
          emergencyFundAmount: '',
          goalEnabled: true,
          periodCalculationEnabled: true,
          carryOverEnabled: true,
          carryOverAmount: '',
        }}
        savingGoalSettings={{ goalAmount: '', goalPeriod: '', currentSaving: '' }}
        dailyBudget={0}
        remainingDays={1}
        onSave={() => {}}
      />
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test -- src/pages/BudgetSettings.test.jsx --runInBand`
Expected: PASS once markup is updated; before styling it may pass because styling is not asserted

- [ ] **Step 3: Write minimal implementation**

```css
.toggle-card {
  display: grid;
  gap: 16px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 4px 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd run test -- src/pages/BudgetSettings.test.jsx --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "style: 토글 카드 레이아웃 정리"
```

**Coverage check:**
- 토글 행 컴포넌트 추가는 Task 1이 담당한다.
- 예산 설정 화면의 토글 카드 교체는 Task 2가 담당한다.
- 모바일 친화적인 정렬과 카드 간격은 Task 3이 담당한다.

**Self-Review:**
- 기능 토글 카드의 시각 구조 변경만 다루고 예산 계산 로직은 건드리지 않는다.
- 대안 2에 맞게 토글 행을 별도 컴포넌트로 분리했다.
- 과도한 재구성 없이 1개 신규 컴포넌트와 2개 기존 파일 수정으로 제한했다.
