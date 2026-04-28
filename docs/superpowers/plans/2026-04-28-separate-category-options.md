# 일반 지출/정기지출 카테고리 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 지출과 정기지출의 카테고리 목록을 분리하고, 기존 저장 데이터의 category 값이 새 목록에 없더라도 선택 입력이 깨지지 않도록 유지한다.

**Architecture:** 카테고리 원천값은 `src/lib/categories.js`로 분리하고, `ExpenseRecords.jsx`는 이 배열을 읽어서 각 select를 렌더링한다. 기존 저장 데이터는 그대로 두고, select value가 배열에 없을 때만 `기존: {category}` 옵션을 임시로 추가하는 fallback을 사용한다.

**Tech Stack:** React, JavaScript, localStorage, Vite

---

### Task 1: 카테고리 상수 파일 추가

**Files:**
- Create: `src/lib/categories.js`

- [ ] **Step 1: 일반/정기 카테고리 배열을 정의한다**

```javascript
export const GENERAL_EXPENSE_CATEGORIES = [
  '식비',
  '생활',
  '쇼핑',
  '교통',
  '의료/건강',
  '문화/여가',
  '교육',
  '경조사/선물',
  '금융/보험',
  '주거/통신',
  '자녀/육아',
  '반려동물',
  '뷰티/미용',
  '기타',
  '미분류',
];

export const RECURRING_EXPENSE_CATEGORIES = [
  '주거/공과금',
  '통신',
  '금융',
  '구독/정기결제',
  '기타 정기 이체',
];
```

- [ ] **Step 2: 저장/수정/삭제와 무관한 순수 상수 파일인지 확인한다**

Run: `Get-Content src/lib/categories.js`
Expected: 일반/정기 카테고리 배열만 포함한다.

### Task 2: ExpenseRecords 카테고리 select 분리

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Test: `src/pages/ExpenseRecords.test.jsx`

- [ ] **Step 1: 카테고리 배열과 fallback 헬퍼를 import한다**

```javascript
import {
  GENERAL_EXPENSE_CATEGORIES,
  RECURRING_EXPENSE_CATEGORIES,
} from '../lib/categories';
```

```javascript
function ensureCategoryOption(options, currentValue, fallbackLabelPrefix = '기존') {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [currentValue, ...options];
}
```

- [ ] **Step 2: 기본 category 값을 새 배열의 첫 값으로 바꾼다**

```javascript
const DEFAULT_RECORD = {
  amount: '',
  category: GENERAL_EXPENSE_CATEGORIES[0] || '식비',
  paymentMethod: '카드',
  type: '일반',
  memo: '',
};

const DEFAULT_RECURRING = {
  name: '',
  amount: '',
  category: RECURRING_EXPENSE_CATEGORIES[0] || '주거/공과금',
  paymentDay: '',
  paymentMethod: '카드',
  memo: '',
};
```

- [ ] **Step 3: 일반 지출 select를 GENERAL_EXPENSE_CATEGORIES.map으로 렌더링한다**

```jsx
const expenseCategoryOptions = ensureCategoryOption(
  GENERAL_EXPENSE_CATEGORIES,
  recordForm.category
);

<select id="expense-category" value={recordForm.category} onChange={updateCategoryField}>
  {expenseCategoryOptions.map((category) => (
    <option key={category} value={category}>
      {category === recordForm.category && !GENERAL_EXPENSE_CATEGORIES.includes(category)
        ? `기존: ${category}`
        : category}
    </option>
  ))}
</select>
```

- [ ] **Step 4: 정기지출 select를 RECURRING_EXPENSE_CATEGORIES.map으로 렌더링한다**

```jsx
const recurringCategoryOptions = ensureCategoryOption(
  RECURRING_EXPENSE_CATEGORIES,
  recurringForm.category
);

<select
  id="recurring-category"
  value={recurringForm.category}
  onChange={(event) =>
    setRecurringForm((current) => ({
      ...current,
      category: event.target.value,
    }))
  }
>
  {recurringCategoryOptions.map((category) => (
    <option key={category} value={category}>
      {category === recurringForm.category && !RECURRING_EXPENSE_CATEGORIES.includes(category)
        ? `기존: ${category}`
        : category}
    </option>
  ))}
</select>
```

- [ ] **Step 5: 최근 기록/수정 모드에서 배열 밖 category가 깨지지 않는지 확인한다**

Run: `npm.cmd exec esbuild -- src/pages/ExpenseRecords.jsx --loader:.jsx=jsx --outfile=expense-records-check.js --log-level=error`
Expected: JSX 파싱 성공.

- [ ] **Step 6: 일반/정기 카테고리 분리와 fallback 렌더를 검증하는 테스트를 추가한다**

```javascript
expect(screen.getAllByRole('option').map((option) => option.textContent)).toContain('식비');
expect(screen.getAllByRole('option').map((option) => option.textContent)).toContain('주거/공과금');
expect(screen.getByRole('option', { name: '기존: 외부카테고리' })).toBeInTheDocument();
```

### Task 3: 문서 동기화

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-28.md`

- [ ] **Step 1: README의 지출 기록 섹션만 갱신한다**

```markdown
- 일반 지출 카테고리와 정기지출 카테고리는 별도로 관리한다.
- 기존 저장 category 값이 새 목록에 없으면 `기존: {category}`로 표시한다.
```

- [ ] **Step 2: 일일 로그에 작업 내용과 검증 결과를 추가한다**

Run: `Get-Content daily-log/2026-04-28.md`
Expected: 오늘 한 일 / 다음에 해야할 일 / 깃허브 푸시기록 형식 유지.

- [ ] **Step 3: 변경사항을 다시 확인한다**

Run: `git diff --check`
Expected: 치명적인 patch 오류 없음.

