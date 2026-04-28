import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

const DEFAULT_RECORD = {
  amount: '',
  category: '식비',
  paymentMethod: '카드',
  type: '일반',
  memo: '',
};

const DEFAULT_RECURRING = {
  name: '',
  amount: '',
  category: '고정지출',
  paymentDay: '',
  paymentMethod: '카드',
  memo: '',
};

export default function ExpenseRecords({
  expenseRecords,
  expenseTemplates,
  recurringExpenses,
  onAddExpenseRecord,
  onAddExpenseTemplate,
  onRemoveExpenseTemplate,
  onAddRecurringExpense,
}) {
  const [recordForm, setRecordForm] = useState(DEFAULT_RECORD);
  const [recurringForm, setRecurringForm] = useState(DEFAULT_RECURRING);

  const hasTemplates = expenseTemplates.length > 0;

  const latestRecords = useMemo(() => expenseRecords.slice(0, 5), [expenseRecords]);

  const updateRecordField = (field) => (event) => {
    setRecordForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const updateRecurringField = (field) => (event) => {
    setRecurringForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const saveExpense = (event) => {
    event.preventDefault();
    onAddExpenseRecord(recordForm);
    setRecordForm(DEFAULT_RECORD);
  };

  const saveTemplate = () => {
    onAddExpenseTemplate({
      id: crypto.randomUUID(),
      ...recordForm,
    });
  };

  const saveRecurring = (event) => {
    event.preventDefault();
    onAddRecurringExpense(recurringForm);
    setRecurringForm(DEFAULT_RECURRING);
  };

  const loadTemplate = (template) => {
    setRecordForm({
      amount: template.amount,
      category: template.category,
      paymentMethod: template.paymentMethod,
      type: template.type || '일반',
      memo: template.memo || '',
    });
  };

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">지출 기록</h1>
          <p className="page-subtitle">
            빠른 입력을 우선하고, 필요한 경우에만 템플릿과 정기지출을 사용합니다.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <form className="card form-grid" onSubmit={saveExpense}>
          <h2 className="section-title">빠른 지출 입력</h2>

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
            <select
              id="expense-category"
              value={recordForm.category}
              onChange={updateRecordField('category')}
            >
              <option>식비</option>
              <option>교통</option>
              <option>쇼핑</option>
              <option>공부</option>
              <option>기타</option>
            </select>
          </FormField>

          <FormField id="expense-method" label="결제수단">
            <select
              id="expense-method"
              value={recordForm.paymentMethod}
              onChange={updateRecordField('paymentMethod')}
            >
              <option>카드</option>
              <option>현금</option>
              <option>이체</option>
            </select>
          </FormField>

          <div className="card stack">
            <h3 className="section-title">고급 옵션</h3>
            <FormField id="expense-type" label="지출유형">
              <select id="expense-type" value={recordForm.type} onChange={updateRecordField('type')}>
                <option>일반</option>
                <option>고정</option>
                <option>정기</option>
              </select>
            </FormField>
            <FormField id="expense-memo" label="메모">
              <textarea
                id="expense-memo"
                value={recordForm.memo}
                onChange={updateRecordField('memo')}
                placeholder="간단한 메모를 적어둘 수 있습니다."
              />
            </FormField>
          </div>

          <div className="form-actions">
            <PrimaryButton type="submit">저장</PrimaryButton>
            <PrimaryButton type="button" variant="ghost" onClick={saveTemplate}>
              템플릿 저장
            </PrimaryButton>
          </div>
        </form>

        <form className="card form-grid" onSubmit={saveRecurring}>
          <h2 className="section-title">정기지출 등록</h2>

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
              type="number"
              inputMode="numeric"
              value={recurringForm.amount}
              onChange={updateRecurringField('amount')}
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
              onChange={updateRecurringField('paymentDay')}
            />
          </FormField>

          <FormField id="recurring-category" label="카테고리">
            <select
              id="recurring-category"
              value={recurringForm.category}
              onChange={updateRecurringField('category')}
            >
              <option>고정지출</option>
              <option>교통</option>
              <option>구독</option>
              <option>식비</option>
            </select>
          </FormField>

          <FormField id="recurring-method" label="결제수단">
            <select
              id="recurring-method"
              value={recurringForm.paymentMethod}
              onChange={updateRecurringField('paymentMethod')}
            >
              <option>카드</option>
              <option>현금</option>
              <option>이체</option>
            </select>
          </FormField>

          <FormField id="recurring-memo" label="메모">
            <textarea
              id="recurring-memo"
              value={recurringForm.memo}
              onChange={updateRecurringField('memo')}
            />
          </FormField>

          <div className="form-actions">
            <PrimaryButton type="submit">정기지출 저장</PrimaryButton>
          </div>
        </form>
      </div>

      <div className="grid-2">
        <section className="card stack">
          <h2 className="section-title">최근 기록</h2>
          {latestRecords.length > 0 ? (
            <div className="list">
              {latestRecords.map((record) => (
                <div key={record.id} className="list-item">
                  <div>
                    <strong>{Number(record.amount).toLocaleString()}원</strong>
                    <div className="muted">
                      {record.category} · {record.paymentMethod} · {record.type}
                    </div>
                  </div>
                  <time className="muted" dateTime={record.date}>
                    {new Date(record.date).toLocaleDateString('ko-KR')}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="기록이 없습니다"
              description="첫 지출을 저장하면 최근 기록이 표시됩니다."
            />
          )}
        </section>

        <section className="card stack">
          <h2 className="section-title">템플릿</h2>
          {hasTemplates ? (
            <div className="list">
              {expenseTemplates.map((template) => (
                <div key={template.id} className="list-item">
                  <button className="muted" type="button" onClick={() => loadTemplate(template)}>
                    {template.category} · {Number(template.amount).toLocaleString()}원
                  </button>
                  <button
                    className="muted"
                    type="button"
                    onClick={() => onRemoveExpenseTemplate(template.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="템플릿이 없습니다"
              description="자주 쓰는 금액을 템플릿으로 저장해 빠르게 불러올 수 있습니다."
            />
          )}
        </section>
      </div>
    </section>
  );
}

