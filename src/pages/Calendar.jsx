import React, { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';

function pad(value) {
  return String(value).padStart(2, '0');
}

function getMonthKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}`;
}

function toDateKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
}

function getDateLabel(date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function getSectionLabel(date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function formatCompactWon(amount) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value === 0) {
    return '0원';
  }

  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);

  if (absValue < 10000) {
    return `${sign}${Math.round(absValue).toLocaleString()}원`;
  }

  const manValue = absValue / 10000;
  const text = Number.isInteger(manValue)
    ? manValue.toLocaleString('ko-KR')
    : manValue.toFixed(1).replace(/\.0$/, '');

  return `${sign}${text}만`;
}

function buildMonthGrid(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function groupRecordsByDate(records) {
  const grouped = records.reduce((accumulator, record) => {
    const key = toDateKey(record.date);

    if (!accumulator[key]) {
      accumulator[key] = {
        dateKey: key,
        date: record.date,
        records: [],
      };
    }

    accumulator[key].records.push(record);
    return accumulator;
  }, {});

  return Object.values(grouped)
    .map((group) => ({
      ...group,
      total: group.records.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    }))
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}

export default function Calendar({ expenseRecords, onSelectDate }) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  const monthKey = getMonthKey(monthCursor);

  const monthRecords = useMemo(
    () => expenseRecords.filter((record) => getMonthKey(record.date) === monthKey),
    [expenseRecords, monthKey]
  );

  const groupedRecords = useMemo(() => groupRecordsByDate(monthRecords), [monthRecords]);
  const monthCells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  const monthTotal = useMemo(
    () => monthRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [monthRecords]
  );

  const activeDays = groupedRecords.length;
  const averageDailySpend = activeDays > 0 ? monthTotal / activeDays : 0;

  useEffect(() => {
    const nextSelectedKey =
      groupedRecords[0]?.dateKey || toDateKey(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1));
    setSelectedDateKey(nextSelectedKey);
  }, [groupedRecords, monthCursor]);

  const selectedGroup = groupedRecords.find((group) => group.dateKey === selectedDateKey);
  const selectedDateLabel = selectedGroup
    ? getDateLabel(selectedGroup.date)
    : getDateLabel(`${selectedDateKey}T00:00:00`);

  const moveMonth = (step) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  };

  const monthLabel = monthCursor.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <section className="page-stack calendar-page">
      <div className="page-hero calendar-hero">
        <div>
          <h1 className="page-title">캘린더</h1>
          <p className="page-subtitle">
            기본 화면은 월별 지출 기록을 먼저 보여주고, 달력은 보조 영역으로 펼쳐서 확인합니다.
          </p>
        </div>

        <div className="calendar-toolbar">
          <button className="calendar-nav" type="button" onClick={() => moveMonth(-1)}>
            이전 달
          </button>
          <strong>{monthLabel}</strong>
          <button className="calendar-nav" type="button" onClick={() => moveMonth(1)}>
            다음 달
          </button>
        </div>

        <div className="calendar-toggle-wrap">
          <button
            type="button"
            className="calendar-toggle"
            onClick={() => setIsCalendarOpen((current) => !current)}
          >
            {isCalendarOpen ? '접기' : '달력 보기'}
          </button>
        </div>
      </div>

      {isCalendarOpen ? (
        <section className="card stack calendar-panel">
          <div className="calendar-grid calendar-grid--head" aria-hidden="true">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {monthCells.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-day calendar-day--empty" aria-hidden="true" />;
              }

              const dateKey = toDateKey(date);
              const records = monthRecords.filter((record) => toDateKey(record.date) === dateKey);
              const total = records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
              const isSelected = dateKey === selectedDateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`calendar-day ${isSelected ? 'selected' : ''} ${
                    records.length > 0 ? 'has-record' : ''
                  }`}
                  onClick={() => {
                    setSelectedDateKey(dateKey);
                    onSelectDate?.(dateKey);
                  }}
                >
                  <span className="calendar-day__date">{date.getDate()}</span>
                  {records.length > 0 ? <span className="calendar-day__amount">{formatCompactWon(total)}</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="calendar-list">
        {groupedRecords.length > 0 ? (
          groupedRecords.map((group) => {
            const isSelected = group.dateKey === selectedDateKey;

            return (
              <section key={group.dateKey} className={`calendar-day-section ${isSelected ? 'is-selected' : ''}`}>
                <button
                  type="button"
                  className="calendar-day-section__header"
                  onClick={() => setSelectedDateKey(group.dateKey)}
                >
                  <strong>{getSectionLabel(group.date)}</strong>
                  <span>{formatCompactWon(group.total)}</span>
                </button>

                <div className="calendar-day-section__items">
                  {group.records.map((record) => (
                    <div key={record.id} className="calendar-day-section__item">
                      <div className="calendar-day-section__item-main">
                        <strong>{formatCompactWon(record.amount)}</strong>
                        <span className="muted">
                          {record.category} · {record.paymentMethod}
                        </span>
                      </div>
                      <div className="calendar-day-section__item-sub">
                        <span className="muted">{record.type}</span>
                        {record.memo ? <span className="muted">{record.memo}</span> : null}
                        <time className="muted" dateTime={record.date}>
                          {new Date(record.date).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <EmptyState
            title="이번 달 지출 기록이 없습니다"
            description="지출 기록을 추가하면 날짜별 목록과 달력에서 함께 확인할 수 있습니다."
            action={
              <PrimaryButton to="/expense-records" variant="ghost">
                지출 기록으로 이동
              </PrimaryButton>
            }
          />
        )}
      </section>

      <section className="calendar-detail card stack">
        <div className="calendar-detail__header">
          <div>
            <h2 className="section-title">선택 날짜</h2>
            <strong>{selectedDateLabel}</strong>
          </div>
          <div className="calendar-detail__total">
            <span className="muted">지출 합계</span>
            <strong>{formatCompactWon(selectedGroup?.total)}</strong>
          </div>
        </div>

        {selectedGroup?.records?.length > 0 ? (
          <div className="list">
            {selectedGroup.records.map((record) => (
              <div key={record.id} className="list-item calendar-record-item">
                <div>
                  <strong>{formatCompactWon(record.amount)}</strong>
                  <div className="muted">
                    {record.category} · {record.paymentMethod} · {record.type}
                  </div>
                  {record.memo ? <div className="muted">{record.memo}</div> : null}
                </div>
                <time className="muted" dateTime={record.date}>
                  {new Date(record.date).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="선택 날짜에는 기록이 없습니다"
            description="위의 날짜 목록이나 달력에서 다른 날짜를 선택해 보세요."
            action={
              <PrimaryButton to="/expense-records" variant="ghost">
                지출 기록으로 이동
              </PrimaryButton>
            }
          />
        )}
      </section>

      <div className="calendar-summary-note sr-only">
        {formatCompactWon(monthTotal)} · {activeDays}일 · {formatCompactWon(averageDailySpend)}
      </div>
    </section>
  );
}
