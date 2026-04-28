import { useMemo } from 'react';
import EmptyState from '../components/EmptyState';
import SummaryCard from '../components/SummaryCard';

function getMonthKey(date) {
  const current = new Date(date);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
}

export default function Statistics({ expenseRecords }) {
  const currentMonthKey = getMonthKey(new Date());

  const summary = useMemo(() => {
    const currentMonthRecords = expenseRecords.filter(
      (record) => getMonthKey(record.date) === currentMonthKey
    );

    const monthlyTotal = currentMonthRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const categoryMap = currentMonthRecords.reduce((accumulator, record) => {
      const key = record.category || '기타';
      accumulator[key] = (accumulator[key] || 0) + Number(record.amount || 0);
      return accumulator;
    }, {});

    const categoryEntries = Object.entries(categoryMap).sort((left, right) => right[1] - left[1]);
    const topCategory = categoryEntries[0] || ['기타', 0];
    const warningCategories = categoryEntries.filter((entry) => entry[1] >= monthlyTotal * 0.25);

    return {
      monthlyTotal,
      categoryEntries,
      topCategory,
      warningCategories,
      currentMonthRecords,
    };
  }, [expenseRecords, currentMonthKey]);

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">분석</h1>
          <p className="page-subtitle">
            월별 소비를 카드형 요약과 간단한 비중 그래프로 보여줍니다.
          </p>
        </div>
      </div>

      <div className="grid-3">
        <SummaryCard
          title="월 지출 요약"
          value={`${Math.round(summary.monthlyTotal).toLocaleString()}원`}
          note={`${summary.currentMonthRecords.length}건 기록`}
        />
        <SummaryCard
          title="가장 많이 쓴 항목"
          value={summary.topCategory[0]}
          note={`${Math.round(summary.topCategory[1]).toLocaleString()}원`}
        />
        <SummaryCard
          title="과소비 후보"
          value={summary.warningCategories.length > 0 ? summary.warningCategories[0][0] : '없음'}
          note="비중이 큰 카테고리"
        />
      </div>

      <div className="grid-2">
        <section className="card stack">
          <h2 className="section-title">카테고리 비중</h2>
          {summary.categoryEntries.length > 0 ? (
            <div className="list">
              {summary.categoryEntries.map(([category, amount]) => {
                const ratio = summary.monthlyTotal > 0 ? Math.round((amount / summary.monthlyTotal) * 100) : 0;

                return (
                  <div key={category} className="stack">
                    <div className="list-item">
                      <strong>{category}</strong>
                      <span className="muted">
                        {Math.round(amount).toLocaleString()}원 · {ratio}%
                      </span>
                    </div>
                    <div className="bar" aria-hidden="true">
                      <span style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="분석할 기록이 없습니다"
              description="지출을 입력하면 카테고리 비중과 월 요약이 표시됩니다."
            />
          )}
        </section>

        <section className="card stack">
          <h2 className="section-title">절약 힌트</h2>
          {summary.warningCategories.length > 0 ? (
            <div className="list">
              {summary.warningCategories.map(([category, amount]) => (
                <div key={category} className="list-item">
                  <div>
                    <strong>{category}</strong>
                    <div className="muted">이번 달 {Math.round(amount).toLocaleString()}원 사용</div>
                  </div>
                  <span className="muted">절약 후보</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="절약 힌트가 없습니다"
              description="기록이 쌓이면 많이 쓴 카테고리부터 절약 후보로 보여줍니다."
            />
          )}
        </section>
      </div>
    </section>
  );
}

