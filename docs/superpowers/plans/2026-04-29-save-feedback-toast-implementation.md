# 저장 피드백 토스트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 저장/적용 성공 여부를 각 페이지에서 공통 토스트로 보여주되, 버튼 문구와 기존 저장 로직은 유지한다.

**Architecture:** `App`에 공통 토스트 상태와 표시 함수를 두고, `BudgetSettings`와 `ExpenseRecords`는 성공 시점에만 토스트를 호출한다. 토스트는 localStorage에 저장하지 않고, 한 번에 하나만 화면에 노출한 뒤 자동 소멸시킨다. 기존 계산 로직, 데이터 구조, 버튼 텍스트는 그대로 둔다.

**Tech Stack:** React, React Router, localStorage, CSS, Vitest, React Testing Library

---

### Task 1: 공통 토스트 상태와 UI 연결

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/Toast.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

```jsx
// App 렌더 결과에서 toast를 직접 확인하는 대신,
// BudgetSettings / ExpenseRecords에서 showToast 호출이 발생한 뒤
// 화면에 토스트 문구가 보이는지 확인하는 통합 테스트를 준비한다.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/BudgetSettings.test.jsx src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: 토스트 관련 테스트가 아직 없으므로, 먼저 실패 테스트를 추가해야 한다.

- [ ] **Step 3: Write minimal implementation**

```jsx
const [toast, setToast] = useState(null);
const toastTimerRef = useRef(null);

const showToast = (message, tone = 'success') => {
  setToast({ id: crypto.randomUUID(), message, tone });
  window.clearTimeout(toastTimerRef.current);
  toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
};
```

```jsx
{toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
```

```jsx
export default function Toast({ message, tone = 'success' }) {
  return (
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/BudgetSettings.test.jsx src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: 토스트 렌더는 가능하지만 아직 페이지 호출이 연결되지 않았을 수 있으므로, 다음 단계에서 연결 테스트를 통과시킨다.

### Task 2: 예산 설정 저장 성공 토스트

**Files:**
- Modify: `src/pages/BudgetSettings.jsx`
- Modify: `src/pages/BudgetSettings.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('shows a toast after saving budget settings', () => {
  const onSave = vi.fn();
  const showToast = vi.fn();

  renderBudgetSettings({ onSave, showToast });

  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));

  expect(onSave).toHaveBeenCalledTimes(1);
  expect(showToast).toHaveBeenCalledWith('예산 설정이 저장되었습니다');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/BudgetSettings.test.jsx --pool=threads false`
Expected: `showToast` 호출이 아직 없어서 실패.

- [ ] **Step 3: Write minimal implementation**

```jsx
export default function BudgetSettings({ onSave, showToast, ...props }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors) {
      return;
    }

    onSave(...);
    showToast?.('예산 설정이 저장되었습니다');
    setSubmitAttempted(false);
  };
}
```

```jsx
<PrimaryButton type="submit" disabled={!canSave}>
  저장하기
</PrimaryButton>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/BudgetSettings.test.jsx --pool=threads false`
Expected: 저장 후 토스트 호출 테스트 통과.

### Task 3: 지출 기록 저장/삭제 성공 토스트

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/pages/ExpenseRecords.test.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('shows a toast after saving a general expense', () => {
  const onAddExpenseRecord = vi.fn();
  const showToast = vi.fn();

  renderExpenseRecords(
    <ExpenseRecords {...baseProps} onAddExpenseRecord={onAddExpenseRecord} showToast={showToast} />
  );

  fireEvent.change(screen.getByLabelText('금액'), { target: { value: '4200' } });
  fireEvent.click(screen.getByRole('button', { name: '지출 저장' }));

  expect(showToast).toHaveBeenCalledWith('일반 지출이 저장되었습니다');
});
```

```jsx
it('shows a toast after saving a recurring expense', () => {
  const onAddRecurringExpense = vi.fn();
  const showToast = vi.fn();

  renderExpenseRecords(
    <ExpenseRecords {...baseProps} onAddRecurringExpense={onAddRecurringExpense} showToast={showToast} />
  );

  fireEvent.click(screen.getByRole('tab', { name: '정기지출 관리' }));
  fireEvent.change(screen.getByLabelText('항목명'), { target: { value: '넷플릭스' } });
  fireEvent.change(screen.getByLabelText('금액'), { target: { value: '17000' } });
  fireEvent.click(screen.getByRole('button', { name: '정기지출 저장' }));

  expect(showToast).toHaveBeenCalledWith('정기지출이 저장되었습니다');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: 아직 `showToast` 호출이 없어서 실패.

- [ ] **Step 3: Write minimal implementation**

```jsx
const saveExpense = (event) => {
  event.preventDefault();
  setGeneralAmountTouched(true);

  if (!generalAmountValidation.isValid) {
    return;
  }

  if (editingExpenseId) {
    onUpdateExpenseRecord(...);
    showToast?.('일반 지출이 수정되었습니다');
    ...
    return;
  }

  onAddExpenseRecord(...);
  showToast?.('일반 지출이 저장되었습니다');
};
```

```jsx
const saveRecurring = (event) => {
  event.preventDefault();
  setRecurringAmountTouched(true);

  if (!recurringAmountValidation.isValid) {
    return;
  }

  if (editingRecurringId) {
    onUpdateRecurringExpense(...);
    showToast?.('정기지출이 수정되었습니다');
    ...
    return;
  }

  onAddRecurringExpense(...);
  showToast?.('정기지출이 저장되었습니다');
};
```

```jsx
const removeExpense = (expenseId) => {
  onDeleteExpenseRecord(expenseId);
  showToast?.('일반 지출이 삭제되었습니다');
};
```

```jsx
const removeRecurring = (recurringId) => {
  onDeleteRecurringExpense(recurringId);
  showToast?.('정기지출이 삭제되었습니다');
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: 저장/수정/삭제 후 토스트 호출 테스트 통과.

### Task 4: App wiring and documentation sync

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`
- Modify: `daily-log/2026-04-29.md`

- [ ] **Step 1: Write the failing test**

```jsx
// App 레벨에서 showToast를 각 페이지에 전달하는 구조가 바뀌었는지
// BudgetSettings / ExpenseRecords 테스트로 이미 검증한다.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/BudgetSettings.test.jsx src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: 페이지 props 연결이 아직 안 되어 있으면 실패.

- [ ] **Step 3: Write minimal implementation**

```jsx
<BudgetSettings ... onSave={updateBudgetSettings} onToggleChange={updateBudgetSettingsField} showToast={showToast} />
<ExpenseRecords ... showToast={showToast} />
```

```md
## 저장 피드백

- 저장 성공 시 공통 토스트로 결과를 안내한다.
- 버튼 문구는 바꾸지 않고, 버튼 클릭 결과만 알린다.
- 토스트 상태는 localStorage에 저장하지 않는다.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/BudgetSettings.test.jsx src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: toast wiring과 저장 피드백 테스트 통과.

---

## Self-Review

### 1. Spec coverage

- 저장 성공 토스트: Task 2, Task 3, Task 4
- 버튼 이름 유지: Task 2, Task 3, Task 4
- localStorage 미사용: Task 1, Task 4
- 공통 토스트 UI: Task 1
- 페이지별 성공 피드백: Task 2, Task 3
- 정기지출 합계 불러오기 안내: `BudgetSettings` 기존 inline note 유지, 필요 시 Task 2에서 토스트로만 추가 가능

### 2. Placeholder scan

- `TBD` 없음
- `TODO` 없음
- 실제 파일 경로 존재
- 테스트 명세가 구체적

### 3. Type consistency

- `showToast(message, tone?)`를 공통 인터페이스로 고정했다.
- `Toast` 컴포넌트는 `message`와 `tone`만 받는다.
- `BudgetSettings`와 `ExpenseRecords`는 선택적 `showToast` prop을 받는다.

