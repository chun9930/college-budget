import React, { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import ExpenseSection from '../components/ExpenseSection';
import FormField from '../components/FormField';
import MetricStrip from '../components/MetricStrip';
import PrimaryButton from '../components/PrimaryButton';
import {
  GENERAL_EXPENSE_CATEGORIES,
  RECURRING_EXPENSE_CATEGORIES,
} from '../lib/categories';
import { getExpensePreviewSnapshot } from '../lib/alert';
import { getToday } from '../lib/budget';

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

function getMonthKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

function getRecentPaymentMethodByCategory(records) {
  return records.reduce((accumulator, record) => {
    if (!record.category || accumulator[record.category]) {
      return accumulator;
    }

    accumulator[record.category] = record.paymentMethod || '카드';
    return accumulator;
  }, {});
}

function getDateKey(date = getToday()) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
    current.getDate()
  ).padStart(2, '0')}`;
}

function formatSelectedDate(dateKey) {
  const current = new Date(`${dateKey}T00:00:00`);
  return current.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function buildDateTimeFromDateKey(dateKey) {
  return `${dateKey}T00:00:00`;
}

function getTodayDateKey(date = getToday()) {
  return getDateKey(date);
}

function getRecurringDateValue(paymentDay, referenceDate = getToday()) {
  const text = String(paymentDay ?? '').trim();

  if (!text) {
    return '';
  }

  if (text.includes('-')) {
    const current = new Date(text);
    return Number.isNaN(current.getTime()) ? '' : getDateKey(current);
  }

  const day = Number(text);

  if (!Number.isFinite(day) || day <= 0) {
    return '';
  }

  const current = new Date(referenceDate);
  const date = new Date(current.getFullYear(), current.getMonth(), day);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return getDateKey(date);
}

function getRecurringDayFromDateValue(dateValue) {
  if (!dateValue) {
    return '';
  }

  const current = new Date(dateValue);

  if (Number.isNaN(current.getTime())) {
    return '';
  }

  return String(current.getDate());
}

function createDefaultRecurringForm(referenceDate = getToday()) {
  return {
    name: '',
    amount: '',
    category: DEFAULT_RECURRING.category,
    paymentDay: getTodayDateKey(referenceDate),
    paymentMethod: DEFAULT_RECURRING.paymentMethod,
    memo: '',
  };
}

function validateAmountInput(rawValue) {
  const text = String(rawValue ?? '').trim();

  if (!text) {
    return { isValid: false, message: '금액을 입력해주세요', numericValue: 0 };
  }

  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return { isValid: false, message: '숫자만 입력할 수 있어요', numericValue: 0 };
  }

  const numericValue = Number(text);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return { isValid: false, message: '0보다 큰 금액을 입력해주세요', numericValue };
  }

  return { isValid: true, message: '', numericValue };
}

function renderChoiceButtons(options, currentValue, onSelect, name, allowFallback = false) {
  const nextOptions =
    allowFallback && currentValue && !options.includes(currentValue)
      ? [{ value: currentValue, label: `기존: ${currentValue}` }, ...options.map((option) => ({ value: option, label: option }))]
      : options.map((option) => ({ value: option, label: option }));

  return (
    <div className="choice-group" role="group" aria-label={name}>
      {nextOptions.map((option) => {
        const isSelected = option.value === currentValue;

        return (
          <button
            key={`${name}-${option.value}`}
            type="button"
            className={`choice-button ${isSelected ? 'is-selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ExpenseRecords({
  expenseRecords,
  recurringExpenses,
  currentDate = getToday(),
  selectedDateKey,
  dailyBudget,
  todaySpent,
  hasBudgetSetup,
  onAddExpenseRecord,
  onUpdateExpenseRecord,
  onDeleteExpenseRecord,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
  showToast,
}) {
  const [recordForm, setRecordForm] = useState(DEFAULT_RECORD);
  const [recurringForm, setRecurringForm] = useState(() => createDefaultRecurringForm(currentDate));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recurringAdvancedOpen, setRecurringAdvancedOpen] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(DEFAULT_RECORD.paymentMethod);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [activeExpensePage, setActiveExpensePage] = useState('general');
  const [generalAmountTouched, setGeneralAmountTouched] = useState(false);
  const [recurringAmountTouched, setRecurringAmountTouched] = useState(false);

  const recentRecords = useMemo(() => expenseRecords.slice(0, 10), [expenseRecords]);
  const recentPaymentMethodsByCategory = useMemo(
    () => getRecentPaymentMethodByCategory(expenseRecords),
    [expenseRecords]
  );

  const currentMonthKey = useMemo(() => getMonthKey(currentDate), [currentDate]);

  const currentMonthTotal = useMemo(
    () =>
      expenseRecords
        .filter((record) => getMonthKey(record.date) === currentMonthKey)
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [currentMonthKey, expenseRecords]
  );

  const generalAmountValidation = useMemo(
    () => validateAmountInput(recordForm.amount),
    [recordForm.amount]
  );
  const recurringAmountValidation = useMemo(
    () => validateAmountInput(recurringForm.amount),
    [recurringForm.amount]
  );

  const generalAmountError =
    generalAmountTouched && !generalAmountValidation.isValid ? generalAmountValidation.message : '';
  const recurringAmountError =
    recurringAmountTouched && !recurringAmountValidation.isValid
      ? recurringAmountValidation.message
      : '';

  const selectedDateLabel = formatSelectedDate(selectedDateKey || getDateKey(currentDate));
  const spendPreview = useMemo(
    () =>
      getExpensePreviewSnapshot({
        hasBudgetSetup,
        dailyBudget,
        todaySpent,
        inputAmount: recordForm.amount,
      }),
    [dailyBudget, hasBudgetSetup, recordForm.amount, todaySpent]
  );

  const updateRecordField = (field) => (event) => {
    const value = event.target.value;

    setRecordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateRecurringField = (field) => (event) => {
    const value = event.target.value;

    setRecurringForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleGeneralAmountChange = (event) => {
    setGeneralAmountTouched(true);
    setRecordForm((current) => ({
      ...current,
      amount: event.target.value,
    }));
  };

  const handleRecurringAmountChange = (event) => {
    setRecurringAmountTouched(true);
    setRecurringForm((current) => ({
      ...current,
      amount: event.target.value,
    }));
  };

  const updateGeneralCategory = (nextCategory) => {
    const nextPaymentMethod =
      recentPaymentMethodsByCategory[nextCategory] || lastPaymentMethod || DEFAULT_RECORD.paymentMethod;

    setRecordForm((current) => ({
      ...current,
      category: nextCategory,
      paymentMethod: nextPaymentMethod,
    }));
  };

  const updateGeneralPaymentMethod = (nextPaymentMethod) => {
    setLastPaymentMethod(nextPaymentMethod);

    setRecordForm((current) => ({
      ...current,
      paymentMethod: nextPaymentMethod,
    }));
  };

  const updateRecurringCategory = (nextCategory) => {
    setRecurringForm((current) => ({
      ...current,
      category: nextCategory,
    }));
  };

  const updateRecurringPaymentMethod = (nextPaymentMethod) => {
    setRecurringForm((current) => ({
      ...current,
      paymentMethod: nextPaymentMethod,
    }));
  };

  const fillFromRecord = (record) => {
    setActiveExpensePage('general');
    setRecordForm({
      amount: String(record.amount || ''),
      category: record.category || DEFAULT_RECORD.category,
      paymentMethod: record.paymentMethod || DEFAULT_RECORD.paymentMethod,
      type: record.type || DEFAULT_RECORD.type,
      memo: record.memo || '',
    });
    setLastPaymentMethod(record.paymentMethod || DEFAULT_RECORD.paymentMethod);
  };

  const fillExpenseFromItem = (item) => {
    setActiveExpensePage('general');
    setRecordForm({
      amount: String(item.amount || ''),
      category: item.category || DEFAULT_RECORD.category,
      paymentMethod: item.paymentMethod || DEFAULT_RECORD.paymentMethod,
      type: '일반',
      memo: item.memo || '',
    });
    setLastPaymentMethod(item.paymentMethod || DEFAULT_RECORD.paymentMethod);
    setAdvancedOpen(true);
    setEditingExpenseId(item.id);
    setGeneralAmountTouched(true);
  };

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setRecordForm(DEFAULT_RECORD);
    setAdvancedOpen(false);
    setGeneralAmountTouched(false);
  };

  const fillRecurringFromItem = (item) => {
    setActiveExpensePage('recurring');
    setRecurringForm({
      name: item.name || '',
      amount: String(item.amount || ''),
      category: item.category || DEFAULT_RECURRING.category,
      paymentDay: getRecurringDateValue(item.paymentDay, currentDate) || getTodayDateKey(currentDate),
      paymentMethod: item.paymentMethod || DEFAULT_RECURRING.paymentMethod,
      memo: item.memo || '',
    });
    setRecurringAdvancedOpen(true);
    setEditingRecurringId(item.id);
    setRecurringAmountTouched(true);
  };

  const cancelRecurringEdit = () => {
    setEditingRecurringId(null);
    setRecurringForm(createDefaultRecurringForm(currentDate));
    setRecurringAdvancedOpen(false);
    setRecurringAmountTouched(false);
  };

  const saveExpense = (event) => {
    event.preventDefault();
    setGeneralAmountTouched(true);

    if (!generalAmountValidation.isValid) {
      return;
    }

    if (editingExpenseId) {
      onUpdateExpenseRecord(editingExpenseId, {
        ...recordForm,
        amount: String(generalAmountValidation.numericValue),
        type: '일반',
      });
      showToast?.('일반 지출이 수정되었습니다');
      setLastPaymentMethod(recordForm.paymentMethod || DEFAULT_RECORD.paymentMethod);
      cancelExpenseEdit();
      return;
    }

    const resolvedDateKey = selectedDateKey || getTodayDateKey();
    onAddExpenseRecord({
      ...recordForm,
      amount: String(generalAmountValidation.numericValue),
      type: '일반',
      date: buildDateTimeFromDateKey(resolvedDateKey),
    });
    showToast?.('일반 지출이 저장되었습니다');
    setLastPaymentMethod(recordForm.paymentMethod || DEFAULT_RECORD.paymentMethod);
    setRecordForm((current) => ({
      ...DEFAULT_RECORD,
      paymentMethod: current.paymentMethod || DEFAULT_RECORD.paymentMethod,
    }));
    setGeneralAmountTouched(false);
  };

  const removeExpense = (expenseId) => {
    onDeleteExpenseRecord(expenseId);
    showToast?.('일반 지출이 삭제되었습니다');

    if (editingExpenseId === expenseId) {
      cancelExpenseEdit();
    }
  };

  const saveRecurring = (event) => {
    event.preventDefault();
    setRecurringAmountTouched(true);

    if (!recurringAmountValidation.isValid) {
      return;
    }

    const payload = {
      ...recurringForm,
      amount: String(recurringAmountValidation.numericValue),
      paymentDay: getRecurringDayFromDateValue(recurringForm.paymentDay),
    };

    if (editingRecurringId) {
      onUpdateRecurringExpense(editingRecurringId, payload);
      showToast?.('정기지출이 수정되었습니다');
      cancelRecurringEdit();
      return;
    }

    onAddRecurringExpense(payload);
    showToast?.('정기지출이 저장되었습니다');
    setRecurringForm(createDefaultRecurringForm(currentDate));
    setRecurringAmountTouched(false);
  };

  const removeRecurring = (recurringId) => {
    onDeleteRecurringExpense(recurringId);
    showToast?.('정기지출이 삭제되었습니다');

    if (editingRecurringId === recurringId) {
      cancelRecurringEdit();
    }
  };

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">지출 기록</h1>
          
          <p className="expense-page-description">실제 생활 중 발생한 소비 기록을 적고 수정하는 영역입니다.</p>
          <p className="expense-page-description">자동 반영된 정기지출 기록은 기록에는 남지만 예산 계산에서는 중복 제외됩니다.</p>
        </div>
      </div>

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

      {activeExpensePage === 'general' ? (
        <ExpenseSection
          title="일반 지출 기록"
          description="선택 날짜의 지출을 입력하고 수정하거나, 최근 기록으로 빠르게 다시 입력할 수 있습니다."
        >
          <div className="calendar-date-banner">
            <strong>선택 날짜</strong>
            <span>{selectedDateLabel}</span>
          </div>

          <MetricStrip
            items={[
              {
                title: '이번 달 지출',
                value: `${Math.round(currentMonthTotal).toLocaleString()}원`,
                note: '월간 지출 합계',
              },
              {
                title: '최근 입력',
                value: `${recentRecords.length}개`,
                note: '최근 기록 10개 기준',
              },
            ]}
          />

          <p className="muted expense-page-description">
            일반 지출은 식비, 카페, 교통비처럼 실제 생활 중 발생한 소비를 기록하는 곳입니다.
            자동 반영된 정기지출은 기록에는 남지만, 예산 계산에서는 중복 제외됩니다.
          </p>

          <div className="expense-section__grid expense-section__grid--general">
            <form className="card form-grid" onSubmit={saveExpense}>
              <h3 className="section-title">지출 기록</h3>
              {editingExpenseId ? (
                <div className="alert-banner">
                  <strong>지출 기록 수정 중</strong>
                  <div className="muted">
                    {Number(recordForm.amount || 0).toLocaleString()}원 · {recordForm.category}
                  </div>
                </div>
              ) : null}

              <FormField id="expense-amount" label="금액">
                <input
                  id="expense-amount"
                  type="text"
                  inputMode="numeric"
                  value={recordForm.amount}
                  onChange={handleGeneralAmountChange}
                  aria-invalid={Boolean(generalAmountError)}
                  className={generalAmountError ? 'input-error' : ''}
                />
                {generalAmountError ? <p className="error-text">{generalAmountError}</p> : null}
                <p className={`muted expense-preview expense-preview--${spendPreview.statusKey}`}>
                  <strong>{spendPreview.statusLabel}</strong>
                  <span>{spendPreview.message}</span>
                </p>
              </FormField>

              <FormField id="expense-category" label="카테고리">
                {renderChoiceButtons(
                  GENERAL_EXPENSE_CATEGORIES,
                  recordForm.category,
                  updateGeneralCategory,
                  '일반 지출 카테고리',
                  true
                )}
              </FormField>

              <FormField id="expense-method" label="결제수단">
                {renderChoiceButtons(
                  ['카드', '현금', '이체'],
                  recordForm.paymentMethod,
                  updateGeneralPaymentMethod,
                  '일반 지출 결제수단'
                )}
              </FormField>

              <button
                className="text-button"
                type="button"
                onClick={() => setAdvancedOpen((current) => !current)}
              >
                {advancedOpen ? '고급 옵션 접기' : '고급 옵션 펼치기'}
              </button>

              {advancedOpen ? (
                <div className="card stack">
                  <h3 className="section-title">고급 옵션</h3>

                  <FormField id="expense-memo" label="메모">
                    <textarea
                      id="expense-memo"
                      value={recordForm.memo}
                      onChange={updateRecordField('memo')}
                    />
                  </FormField>
                </div>
              ) : null}

              <div className="form-actions">
                {editingExpenseId ? (
                  <>
                    <button className="text-button" type="button" onClick={cancelExpenseEdit}>
                      수정 취소
                    </button>
                    <PrimaryButton type="submit" disabled={!generalAmountValidation.isValid}>
                      지출 수정 저장
                    </PrimaryButton>
                  </>
                ) : (
                  <PrimaryButton type="submit" disabled={!generalAmountValidation.isValid}>
                    지출 저장
                  </PrimaryButton>
                )}
              </div>
            </form>

            <section className="card stack">
              <h3 className="section-title">일반 지출 기록 목록</h3>
              {expenseRecords.length > 0 ? (
                <div className="list">
                  {expenseRecords.map((item) => (
                    <div key={item.id} className="list-item recurring-item">
                      <div>
                        <strong>{Number(item.amount || 0).toLocaleString()}원</strong>
                        <div className="muted">
                          {item.category} · {item.paymentMethod}
                        </div>
                        <div className="muted">{new Date(item.date).toLocaleDateString('ko-KR')}</div>
                        {item.sourceRecurringId ? (
                          <>
                            <span className="expense-source-badge">자동 정기지출</span>
                            <p className="expense-source-note">예산 계산 중복 제외</p>
                          </>
                        ) : null}
                      </div>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => fillExpenseFromItem(item)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeExpense(item.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="일반 지출 기록이 없습니다"
                  description="금액, 카테고리, 결제수단을 입력해 지출을 저장하면 여기서 확인할 수 있습니다."
                />
              )}
            </section>

            <section className="card stack">
              <h3 className="section-title">최근 기록으로 빠른 입력</h3>
              <p className="muted">최근 기록을 누르면 금액, 카테고리, 결제수단이 바로 채워집니다.</p>
              {recentRecords.length > 0 ? (
                <div className="list">
                  {recentRecords.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      className="list-item recent-record-button"
                      onClick={() => fillFromRecord(record)}
                    >
                      <div>
                        <strong>{Number(record.amount || 0).toLocaleString()}원</strong>
                        <div className="muted">
                          {record.category} · {record.paymentMethod}
                        </div>
                      </div>
                      <time className="muted" dateTime={record.date}>
                        {new Date(record.date).toLocaleDateString('ko-KR')}
                      </time>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="기록이 없습니다"
                  description="첫 지출을 저장하면 최근 기록으로 빠른 입력 영역이 생깁니다."
                />
              )}
            </section>
          </div>
        </ExpenseSection>
      ) : (
        <ExpenseSection
          title="정기지출 관리"
          description="주거비, 통신, 구독처럼 반복되는 항목을 입력하고 관리할 수 있습니다."
        >
          <div className="calendar-date-banner">
            <strong>정기지출 합계</strong>
            <span>
              {Math.round(
                recurringExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
              ).toLocaleString()}원
            </span>
          </div>

          <p className="muted expense-page-description">
            정기지출은 월세, 통신비, 구독료처럼 반복되는 고정비입니다. 수동 고정지출과는
            별도로 저장되며, 자동 반영을 켜면 예산 계산에 포함됩니다.
          </p>

          <div className="grid-2 expense-section__grid">
            <form className="card form-grid" onSubmit={saveRecurring}>
              <h3 className="section-title">정기지출 관리</h3>
              {editingRecurringId ? (
                <div className="alert-banner">
                  <strong>정기지출 수정 중</strong>
                  <div className="muted">
                    {recurringForm.name || '항목명 없음'} ·{' '}
                    {Number(recurringForm.amount || 0).toLocaleString()}원
                  </div>
                </div>
              ) : null}

              <FormField id="recurring-name" label="항목명">
                <input
                  id="recurring-name"
                  value={recurringForm.name}
                  onChange={updateRecurringField('name')}
                />
              </FormField>

              <FormField id="recurring-amount" label="금액">
                <input
                  id="recurring-amount"
                  type="text"
                  inputMode="numeric"
                  value={recurringForm.amount}
                  onChange={handleRecurringAmountChange}
                  aria-invalid={Boolean(recurringAmountError)}
                  className={recurringAmountError ? 'input-error' : ''}
                />
                {recurringAmountError ? <p className="error-text">{recurringAmountError}</p> : null}
              </FormField>

              <FormField id="recurring-day" label="결제일">
                <input
                  id="recurring-day"
                  type="date"
                  value={recurringForm.paymentDay}
                  onChange={updateRecurringField('paymentDay')}
                />
              </FormField>

              <FormField id="recurring-category" label="카테고리">
                {renderChoiceButtons(
                  RECURRING_EXPENSE_CATEGORIES,
                  recurringForm.category,
                  updateRecurringCategory,
                  '정기지출 카테고리',
                  true
                )}
              </FormField>

              <FormField id="recurring-method" label="결제수단">
                {renderChoiceButtons(
                  ['카드', '현금', '이체'],
                  recurringForm.paymentMethod,
                  updateRecurringPaymentMethod,
                  '정기지출 결제수단'
                )}
              </FormField>

              <button
                className="text-button"
                type="button"
                onClick={() => setRecurringAdvancedOpen((current) => !current)}
              >
                {recurringAdvancedOpen ? '고급 옵션 접기' : '고급 옵션 펼치기'}
              </button>

              {recurringAdvancedOpen ? (
                <div className="card stack">
                  <h3 className="section-title">고급 옵션</h3>

                  <FormField id="recurring-memo" label="메모">
                    <textarea
                      id="recurring-memo"
                      value={recurringForm.memo}
                      onChange={updateRecurringField('memo')}
                    />
                  </FormField>
                </div>
              ) : null}

              <div className="form-actions">
                {editingRecurringId ? (
                  <>
                    <button className="text-button" type="button" onClick={cancelRecurringEdit}>
                      수정 취소
                    </button>
                    <PrimaryButton type="submit" disabled={!recurringAmountValidation.isValid}>
                      정기지출 수정 저장
                    </PrimaryButton>
                  </>
                ) : (
                  <PrimaryButton type="submit" disabled={!recurringAmountValidation.isValid}>
                    정기지출 저장
                  </PrimaryButton>
                )}
              </div>
            </form>

            <section className="card stack">
              <h3 className="section-title">정기지출 목록</h3>
              {recurringExpenses.length > 0 ? (
                <div className="list">
                  {recurringExpenses.map((item) => (
                    <div key={item.id} className="list-item recurring-item recurring-item--stacked">
                      <div className="recurring-item__content">
                        <strong>
                          {item.paymentDay}일 · {item.name}
                        </strong>
                        <div className="muted">
                          {item.category} · {item.paymentMethod}
                        </div>
                        <div className="muted">{Number(item.amount || 0).toLocaleString()}원</div>
                        {item.memo ? <div className="muted">{item.memo}</div> : null}
                      </div>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => fillRecurringFromItem(item)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeRecurring(item.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="정기지출이 없습니다"
                  description="주거비, 통신, 구독 같은 반복 항목을 등록하면 자동 반영됩니다."
                />
              )}
            </section>
          </div>
        </ExpenseSection>
      )}
    </section>
  );
}
