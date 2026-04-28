import React, { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import MetricStrip from '../components/MetricStrip';
import PrimaryButton from '../components/PrimaryButton';
import {
  GENERAL_EXPENSE_CATEGORIES,
  RECURRING_EXPENSE_CATEGORIES,
} from '../lib/categories';

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

function getDateKey(date = new Date()) {
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

function getCategoryOptions(categories, currentValue) {
  if (!currentValue || categories.includes(currentValue)) {
    return categories.map((category) => ({
      value: category,
      label: category,
    }));
  }

  return [
    {
      value: currentValue,
      label: `기존: ${currentValue}`,
    },
    ...categories.map((category) => ({
      value: category,
      label: category,
    })),
  ];
}

function renderOptions(options) {
  return options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));
}

export default function ExpenseRecords({
  expenseRecords,
  recurringExpenses,
  selectedDateKey,
  onAddExpenseRecord,
  onUpdateExpenseRecord,
  onDeleteExpenseRecord,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
}) {
  const [recordForm, setRecordForm] = useState(DEFAULT_RECORD);
  const [recurringForm, setRecurringForm] = useState(DEFAULT_RECURRING);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(DEFAULT_RECORD.paymentMethod);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingRecurringId, setEditingRecurringId] = useState(null);

  const recentRecords = useMemo(() => expenseRecords.slice(0, 10), [expenseRecords]);
  const recentPaymentMethodsByCategory = useMemo(
    () => getRecentPaymentMethodByCategory(expenseRecords),
    [expenseRecords]
  );

  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);

  const currentMonthTotal = useMemo(
    () =>
      expenseRecords
        .filter((record) => getMonthKey(record.date) === currentMonthKey)
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [currentMonthKey, expenseRecords]
  );

  const updateRecordField = (field) => (event) => {
    const value = event.target.value;
    setRecordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCategoryField = (event) => {
    const nextCategory = event.target.value;
    const nextPaymentMethod =
      recentPaymentMethodsByCategory[nextCategory] || lastPaymentMethod || DEFAULT_RECORD.paymentMethod;

    setRecordForm((current) => ({
      ...current,
      category: nextCategory,
      paymentMethod: nextPaymentMethod,
    }));
  };

  const updatePaymentMethodField = (event) => {
    const nextPaymentMethod = event.target.value;
    setLastPaymentMethod(nextPaymentMethod);
    setRecordForm((current) => ({
      ...current,
      paymentMethod: nextPaymentMethod,
    }));
  };

  const fillFromRecord = (record) => {
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
    setRecordForm({
      amount: String(item.amount || ''),
      category: item.category || DEFAULT_RECORD.category,
      paymentMethod: item.paymentMethod || DEFAULT_RECORD.paymentMethod,
      type: item.type || DEFAULT_RECORD.type,
      memo: item.memo || '',
    });
    setLastPaymentMethod(item.paymentMethod || DEFAULT_RECORD.paymentMethod);
    setAdvancedOpen(true);
    setEditingExpenseId(item.id);
  };

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setRecordForm(DEFAULT_RECORD);
  };

  const fillRecurringFromItem = (item) => {
    setRecurringForm({
      name: item.name || '',
      amount: String(item.amount || ''),
      category: item.category || DEFAULT_RECURRING.category,
      paymentDay: String(item.paymentDay || ''),
      paymentMethod: item.paymentMethod || DEFAULT_RECURRING.paymentMethod,
      memo: item.memo || '',
    });
    setEditingRecurringId(item.id);
  };

  const cancelRecurringEdit = () => {
    setEditingRecurringId(null);
    setRecurringForm(DEFAULT_RECURRING);
  };

  const saveExpense = (event) => {
    event.preventDefault();

    if (editingExpenseId) {
      onUpdateExpenseRecord(editingExpenseId, recordForm);
      setLastPaymentMethod(recordForm.paymentMethod || DEFAULT_RECORD.paymentMethod);
      cancelExpenseEdit();
      return;
    }

    const resolvedDateKey = selectedDateKey || getDateKey(new Date());
    onAddExpenseRecord({
      ...recordForm,
      date: buildDateTimeFromDateKey(resolvedDateKey),
    });
    setLastPaymentMethod(recordForm.paymentMethod || DEFAULT_RECORD.paymentMethod);
    setRecordForm((current) => ({
      ...DEFAULT_RECORD,
      paymentMethod: current.paymentMethod || DEFAULT_RECORD.paymentMethod,
    }));
  };

  const removeExpense = (expenseId) => {
    onDeleteExpenseRecord(expenseId);
    if (editingExpenseId === expenseId) {
      cancelExpenseEdit();
    }
  };

  const saveRecurring = (event) => {
    event.preventDefault();

    if (editingRecurringId) {
      onUpdateRecurringExpense(editingRecurringId, recurringForm);
      cancelRecurringEdit();
      return;
    }

    onAddRecurringExpense(recurringForm);
    setRecurringForm(DEFAULT_RECURRING);
  };

  const removeRecurring = (recurringId) => {
    onDeleteRecurringExpense(recurringId);
    if (editingRecurringId === recurringId) {
      cancelRecurringEdit();
    }
  };

  const generalCategoryOptions = getCategoryOptions(GENERAL_EXPENSE_CATEGORIES, recordForm.category);
  const recurringCategoryOptions = getCategoryOptions(
    RECURRING_EXPENSE_CATEGORIES,
    recurringForm.category
  );

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">지출 기록</h1>
          <p className="page-subtitle">
            지출 기록은 최소 입력으로 빠르게 적고, 최근 기록과 정기지출로 다시 입력할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="calendar-date-banner">
        <strong>선택 날짜</strong>
        <span>{formatSelectedDate(selectedDateKey || getDateKey(new Date()))}</span>
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
          {
            title: '정기지출',
            value: `${recurringExpenses.length}개`,
            note: '정기 항목 자동 반영',
          },
        ]}
      />

      <div className="grid-2">
        <form className="card form-grid" onSubmit={saveExpense}>
          <h2 className="section-title">지출 기록</h2>
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
              type="number"
              inputMode="numeric"
              value={recordForm.amount}
              onChange={updateRecordField('amount')}
            />
          </FormField>

          <FormField id="expense-category" label="카테고리">
            <select id="expense-category" value={recordForm.category} onChange={updateCategoryField}>
              {renderOptions(generalCategoryOptions)}
            </select>
          </FormField>

          <FormField id="expense-method" label="결제수단">
            <select
              id="expense-method"
              value={recordForm.paymentMethod}
              onChange={updatePaymentMethodField}
            >
              <option value="카드">카드</option>
              <option value="현금">현금</option>
              <option value="이체">이체</option>
            </select>
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

              <FormField id="expense-type" label="지출 유형">
                <select id="expense-type" value={recordForm.type} onChange={updateRecordField('type')}>
                  <option value="일반">일반</option>
                  <option value="고정">고정</option>
                  <option value="정기">정기</option>
                </select>
              </FormField>

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
                <PrimaryButton type="submit">지출 수정 저장</PrimaryButton>
              </>
            ) : (
              <PrimaryButton type="submit">지출 저장</PrimaryButton>
            )}
          </div>
        </form>

        <form className="card form-grid" onSubmit={saveRecurring}>
          <h2 className="section-title">정기지출 관리</h2>
          {editingRecurringId ? (
            <div className="alert-banner">
              <strong>정기지출 수정 중</strong>
              <div className="muted">
                {recurringForm.name || '항목명 없음'} · {Number(recurringForm.amount || 0).toLocaleString()}원
              </div>
            </div>
          ) : null}

          <FormField id="recurring-name" label="항목명">
            <input
              id="recurring-name"
              value={recurringForm.name}
              onChange={(event) =>
                setRecurringForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField id="recurring-amount" label="금액">
            <input
              id="recurring-amount"
              type="number"
              inputMode="numeric"
              value={recurringForm.amount}
              onChange={(event) =>
                setRecurringForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField id="recurring-day" label="결제일">
            <input
              id="recurring-day"
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={recurringForm.paymentDay}
              onChange={(event) =>
                setRecurringForm((current) => ({
                  ...current,
                  paymentDay: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField id="recurring-category" label="카테고리">
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
              {renderOptions(recurringCategoryOptions)}
            </select>
          </FormField>

          <FormField id="recurring-method" label="결제수단">
            <select
              id="recurring-method"
              value={recurringForm.paymentMethod}
              onChange={(event) =>
                setRecurringForm((current) => ({
                  ...current,
                  paymentMethod: event.target.value,
                }))
              }
            >
              <option value="카드">카드</option>
              <option value="현금">현금</option>
              <option value="이체">이체</option>
            </select>
          </FormField>

          <FormField id="recurring-memo" label="메모">
            <textarea
              id="recurring-memo"
              value={recurringForm.memo}
              onChange={(event) =>
                setRecurringForm((current) => ({
                  ...current,
                  memo: event.target.value,
                }))
              }
            />
          </FormField>

          <div className="form-actions">
            {editingRecurringId ? (
              <>
                <button className="text-button" type="button" onClick={cancelRecurringEdit}>
                  수정 취소
                </button>
                <PrimaryButton type="submit">정기지출 수정 저장</PrimaryButton>
              </>
            ) : (
              <PrimaryButton type="submit">정기지출 저장</PrimaryButton>
            )}
          </div>
        </form>
      </div>

      <section className="card stack">
        <h2 className="section-title">일반 지출 기록</h2>
        {expenseRecords.length > 0 ? (
          <div className="list">
            {expenseRecords.map((item) => (
              <div key={item.id} className="list-item recurring-item">
                <div>
                  <strong>{Number(item.amount || 0).toLocaleString()}원</strong>
                  <div className="muted">
                    {item.category} · {item.paymentMethod} · {item.type}
                  </div>
                  <div className="muted">{new Date(item.date).toLocaleDateString('ko-KR')}</div>
                </div>
                <div className="inline-actions">
                  <button type="button" className="text-button" onClick={() => fillExpenseFromItem(item)}>
                    수정
                  </button>
                  <button type="button" className="text-button" onClick={() => removeExpense(item.id)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="일반 지출 기록이 없습니다"
            description="금액, 카테고리, 결제수단을 입력해 지출을 저장하면 여기에 표시됩니다."
          />
        )}
      </section>

      <div className="grid-2">
        <section className="card stack">
          <h2 className="section-title">최근 기록으로 빠른 입력</h2>
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
                      {record.category} · {record.paymentMethod} · {record.type}
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

        <section className="card stack">
          <h2 className="section-title">정기지출</h2>
          {recurringExpenses.length > 0 ? (
            <div className="list">
              {recurringExpenses.map((item) => (
                <div key={item.id} className="list-item recurring-item">
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">
                      {Number(item.amount || 0).toLocaleString()}원 · 매월 {item.paymentDay}일 ·{' '}
                      {item.paymentMethod}
                    </div>
                    <div className="muted">{item.category}</div>
                  </div>
                  <div className="inline-actions">
                    <button type="button" className="text-button" onClick={() => fillRecurringFromItem(item)}>
                      수정
                    </button>
                    <button type="button" className="text-button" onClick={() => removeRecurring(item.id)}>
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
    </section>
  );
}
