# Expense Records Amount Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일반 지출과 정기지출 입력 폼의 금액을 실시간 검증하고, 잘못된 값은 인라인 에러 메시지와 비활성화된 저장 버튼으로 막는다.

**Architecture:** `ExpenseRecords.jsx` 안에 폼별 금액 검증 상태를 추가하고, 일반 지출/정기지출 각각에서 같은 검증 규칙을 재사용한다. `alert()`는 사용하지 않고, 입력값이 바뀔 때마다 에러 메시지와 버튼 활성 상태가 즉시 갱신되게 한다. 저장/수정/삭제, 최근 기록 자동 입력, 선택 날짜 저장, 정기지출 구조는 그대로 둔다.

**Tech Stack:** React, existing form state, existing CSS utilities, Vitest, Testing Library

---

### Task 1: 공통 금액 검증 상태와 일반 지출 폼 연결

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/pages/ExpenseRecords.test.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

Add tests that cover the general expense amount field:

```jsx
it('shows a validation message and disables save for invalid general expense amounts', () => {
  renderExpenseRecords(<ExpenseRecords {...baseProps} />);

  const amountInput = screen.getAllByLabelText('금액')[0];
  const saveButton = screen.getByRole('button', { name: '지출 저장' });

  fireEvent.change(amountInput, { target: { value: '' } });
  expect(screen.getByText('금액을 입력해주세요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: '0' } });
  expect(screen.getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: '-10' } });
  expect(screen.getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: 'abc' } });
  expect(screen.getByText('숫자만 입력할 수 있어요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: '1200' } });
  expect(screen.queryByText('금액을 입력해주세요')).not.toBeInTheDocument();
  expect(saveButton).not.toBeDisabled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: FAIL because amount validation state and messages do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a reusable helper near the top of `ExpenseRecords.jsx`:

```jsx
function validateAmountInput(rawValue) {
  const text = String(rawValue ?? '').trim();

  if (!text) {
    return { isValid: false, message: '금액을 입력해주세요' };
  }

  const numericValue = Number(text);

  if (!Number.isFinite(numericValue)) {
    return { isValid: false, message: '숫자만 입력할 수 있어요' };
  }

  if (numericValue <= 0) {
    return { isValid: false, message: '0보다 큰 금액을 입력해주세요' };
  }

  return { isValid: true, message: '' };
}
```

Add derived state for the general amount field:

```jsx
const generalAmountValidation = useMemo(
  () => validateAmountInput(recordForm.amount),
  [recordForm.amount]
);
```

Update the general amount input to use text-based entry and show inline error text:

```jsx
<input
  id="expense-amount"
  type="text"
  inputMode="numeric"
  value={recordForm.amount}
  onChange={updateRecordField('amount')} 
  className={generalAmountValidation.isValid ? '' : 'input-error'}
/>
{!generalAmountValidation.isValid ? (
  <p className="error-text">{generalAmountValidation.message}</p>
) : null}
```

Disable the save button when invalid:

```jsx
<PrimaryButton type="submit" disabled={!generalAmountValidation.isValid}>
  지출 저장
</PrimaryButton>
```

Preserve existing save/update logic by keeping `saveExpense` unchanged except for the disabled button guard.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: PASS for the new general amount validation behavior and existing expense save flow.

- [ ] **Step 5: Commit**

Do not commit in this session unless the user explicitly approves it.

### Task 2: 정기지출 금액 검증 연결

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`
- Modify: `src/pages/ExpenseRecords.test.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

Add tests that cover the recurring amount field:

```jsx
it('shows a validation message and disables save for invalid recurring amounts', () => {
  renderExpenseRecords(<ExpenseRecords {...baseProps} />);

  fireEvent.click(screen.getByRole('tab', { name: '정기지출 관리' }));

  const recurringSection = screen.getByRole('heading', { name: '정기지출 관리' }).closest('section');
  const amountInput = within(recurringSection).getByLabelText('금액');
  const saveButton = within(recurringSection).getByRole('button', { name: '정기지출 저장' });

  fireEvent.change(amountInput, { target: { value: '' } });
  expect(within(recurringSection).getByText('금액을 입력해주세요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: '0' } });
  expect(within(recurringSection).getByText('0보다 큰 금액을 입력해주세요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: 'abc' } });
  expect(within(recurringSection).getByText('숫자만 입력할 수 있어요')).toBeInTheDocument();
  expect(saveButton).toBeDisabled();

  fireEvent.change(amountInput, { target: { value: '17000' } });
  expect(within(recurringSection).queryByText('금액을 입력해주세요')).not.toBeInTheDocument();
  expect(saveButton).not.toBeDisabled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: FAIL until the recurring form uses the shared validation state.

- [ ] **Step 3: Write minimal implementation**

Reuse `validateAmountInput()` for `recurringForm.amount`:

```jsx
const recurringAmountValidation = useMemo(
  () => validateAmountInput(recurringForm.amount),
  [recurringForm.amount]
);
```

Update the recurring amount field with inline error text and disabled save button:

```jsx
<input
  id="recurring-amount"
  type="text"
  inputMode="numeric"
  value={recurringForm.amount}
  onChange={updateRecurringField('amount')}
  className={recurringAmountValidation.isValid ? '' : 'input-error'}
/>
{!recurringAmountValidation.isValid ? (
  <p className="error-text">{recurringAmountValidation.message}</p>
) : null}

<PrimaryButton type="submit" disabled={!recurringAmountValidation.isValid}>
  정기지출 저장
</PrimaryButton>
```

Keep recurring save/update logic unchanged apart from the disabled button guard.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/ExpenseRecords.test.jsx --pool=threads false`
Expected: PASS for recurring amount validation and existing recurring save flow.

- [ ] **Step 5: Commit**

Do not commit in this session unless the user explicitly approves it.

### Task 3: Shared styling and documentation sync

**Files:**
- Modify: `src/index.css`
- Modify: `README.md`
- Modify: `daily-log/2026-04-29.md`

- [ ] **Step 1: Write the failing test**

The failing tests from Tasks 1 and 2 already cover the behavior; no new test file is required.

- [ ] **Step 2: Run test to verify it fails**

Not applicable; this task follows the behavioral fixes from Tasks 1 and 2.

- [ ] **Step 3: Write minimal implementation**

Add minimal invalid-state styling:

```css
.input-error {
  border-color: rgba(217, 70, 95, 0.7) !important;
}

.error-text {
  margin: 4px 0 0;
  color: var(--danger);
  font-size: 0.9rem;
  font-weight: 700;
}
```

Update only the relevant README sections to mention that both amount fields validate in real time and show inline error text instead of alert dialogs.

Append a Korean daily log entry with the three required sections.

- [ ] **Step 4: Run test to verify it passes**

Run the same Vitest command and confirm the validation styles do not break the existing UI.

- [ ] **Step 5: Commit**

Do not commit in this session unless the user explicitly approves it.

## Self-Review

- Spec coverage: general amount validation, recurring amount validation, inline error state, disabled save buttons, docs sync.
- Placeholder scan: none left in the concrete implementation steps.
- Type consistency: shared helper name is `validateAmountInput`, state names are `generalAmountValidation` and `recurringAmountValidation`.
- Scope check: focused on amount validation only; existing save/update/delete logic stays intact.
