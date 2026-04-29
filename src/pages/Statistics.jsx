import React, { useMemo } from 'react';
import EmptyState from '../components/EmptyState';

function getMonthKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

function getDateKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
    current.getDate()
  ).padStart(2, '0')}`;
}

function formatCompactWon(amount) {
  const value = Number(amount || 0);

  if (!Number.isFinite(value) || value === 0) {
    return '0원';
  }

  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);

  if (absValue < 10000) {
    return `${sign}${Math.round(absValue).toLocaleString('ko-KR')}원`;
  }

  const manValue = absValue / 10000;
  const text = Number.isInteger(manValue)
    ? manValue.toLocaleString('ko-KR')
    : manValue.toFixed(1).replace(/\.0$/, '');

  return `${sign}${text}만`;
}

function formatWon(amount) {
  return `${Math.round(amount || 0).toLocaleString()}원`;
}

function formatMonthLabel(date = new Date()) {
  const current = new Date(date);
  return `${current.getFullYear()}년 ${current.getMonth() + 1}월`;
}

function formatDayLabel(dateKey) {
  const [, , day] = dateKey.split('-');
  return `${Number(day)}일 총 지출`;
}

export default function Statistics({ expenseRecords }) {
  const currentMonthKey = getMonthKey(new Date());

  const summary = useMemo(() => {
    const currentMonthRecords = expenseRecords.filter(
      (record) => getMonthKey(record.date) === currentMonthKey
    );

    const monthlyTotal = currentMonthRecords.reduce(
      (sum, record) => sum + Number(record.amount || 0),
      0
    );

    const dailyMap = currentMonthRecords.reduce((accumulator, record) => {
      const dateKey = getDateKey(record.date);
      accumulator[dateKey] = (accumulator[dateKey] || 0) + Number(record.amount || 0);
      return accumulator;
    }, {});

    const categoryMap = currentMonthRecords.reduce((accumulator, record) => {
      const key = record.category || '기타';
      accumulator[key] = (accumulator[key] || 0) + Number(record.amount || 0);
      return accumulator;
    }, {});

    const dailyEntries = Object.entries(dailyMap).sort((left, right) =>
      left[0].localeCompare(right[0])
    );
    const categoryEntries = Object.entries(categoryMap).sort((left, right) => right[1] - left[1]);
    const topCategory = categoryEntries[0] || ['기타', 0];
    const maxDailyTotal = dailyEntries.reduce((max, [, amount]) => Math.max(max, amount), 0);
    const topCategoryRatio = monthlyTotal > 0 ? Math.round((topCategory[1] / monthlyTotal) * 100) : 0;

    return {
      currentMonthRecords,
      monthlyTotal,
      dailyEntries,
      categoryEntries,
      topCategory,
      maxDailyTotal,
      topCategoryRatio,
    };
  }, [expenseRecords, currentMonthKey]);

  const hasRecords = summary.currentMonthRecords.length > 0;

  return (
    <section className="page-stack">
      <div className="page-hero statistics-hero">
        <div>
          <h1 className="page-title">분석</h1>
          <p className="statistics-hero__total">
            이번 달 {formatWon(summary.monthlyTotal)} 썼어요
          </p>
          <p className="page-subtitle">저장된 지출 기록 기준입니다</p>
        </div>
        <div className="statistics-hero__meta">
          <span className="muted">{formatMonthLabel()} 기준</span>
          <strong>{summary.currentMonthRecords.length}건 기록</strong>
        </div>
      </div>

      {!hasRecords ? (
        <EmptyState
          title="분석할 기록이 없습니다"
          description="지출을 저장하면 이번 달 총 지출, 일별 막대, 카테고리 비중을 볼 수 있습니다."
        />
      ) : (
        <>
          <section className="card stack">
            <div className="section-head">
              <h2 className="section-title">일별 지출 막대</h2>
              <span className="muted">이번 달 기록을 날짜별로 묶어 보여줍니다</span>
            </div>
            <div className="daily-chart" aria-label="일별 지출 막대 차트">
              {summary.dailyEntries.map(([dateKey, amount]) => {
                const height =
                  summary.maxDailyTotal > 0 ? Math.max((amount / summary.maxDailyTotal) * 100, 10) : 10;

                return (
                  <div key={dateKey} className="daily-chart__item">
                    <div className="daily-chart__bar" aria-hidden="true">
                      <span style={{ height: `${height}%` }} />
                    </div>
                    <strong className="daily-chart__amount">{formatCompactWon(amount)}</strong>
                    <span className="daily-chart__label">{formatDayLabel(dateKey)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid-2">
            <section className="card stack">
              <div className="section-head">
                <h2 className="section-title">카테고리별 지출 비중</h2>
                <span className="muted">금액이 큰 순서대로 정렬했습니다</span>
              </div>
              <div className="list">
                {summary.categoryEntries.map(([category, amount]) => {
                  const ratio =
                    summary.monthlyTotal > 0 ? Math.round((amount / summary.monthlyTotal) * 100) : 0;

                  return (
                    <div key={category} className="category-stat">
                      <div className="list-item">
                        <strong>{category}</strong>
                        <span className="muted">
                          {ratio}% · {formatWon(amount)}
                        </span>
                      </div>
                      <div className="bar" aria-hidden="true">
                        <span style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="stack">
              <section className="card stack">
                <h2 className="section-title">이번 달 가장 많이 쓴 항목</h2>
                <p className="statistics-highlight">
                  이번 달 가장 많이 쓴 항목은 <strong>{summary.topCategory[0]}</strong>예요.
                </p>
                <p className="muted">
                  {formatWon(summary.topCategory[1])} · 전체의 {summary.topCategoryRatio}%를 차지합니다.
                </p>
              </section>

              <section className="card stack">
                <h2 className="section-title">절약 힌트</h2>
                <div className="list">
                  <div className="list-item">
                    <span>가장 큰 지출 카테고리부터 확인해보세요.</span>
                  </div>
                  <div className="list-item">
                    <span>이번 달 지출 기록이 적으면 분석 정확도가 낮을 수 있어요.</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
