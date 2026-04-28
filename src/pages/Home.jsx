import React from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';
import MetricStrip from '../components/MetricStrip';
import StatusBadge from '../components/StatusBadge';

export default function Home({
  dailyBudget,
  todaySpent,
  alertState,
  alertDismissed,
  fixedExpenseTotal,
  remainingDays,
  currentUser,
  onDismissAlert,
}) {
  const shouldShowBanner = !alertDismissed && alertState.key !== 'safe';

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">홈</h1>
          <p className="page-subtitle">
            오늘 소비를 해도 되는지 빠르게 판단하고, 필요한 경우 바로 예산 설정으로 이동합니다.
          </p>
          {currentUser ? <p className="page-hero__meta">{currentUser.name} 님이 로그인되어 있습니다.</p> : null}
        </div>
        <StatusBadge label={alertState.label} tone={alertState.key} />
      </div>

      {shouldShowBanner ? (
        <div className={`alert-banner ${alertState.key}`}>
          <div className="alert-copy">
            <h3>{alertState.label}</h3>
            <p>{alertState.description}</p>
          </div>
          <div className="form-actions">
            <PrimaryButton onClick={onDismissAlert} variant="subtle">
              알림 숨기기
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      <MetricStrip
        items={[
          {
            title: '오늘 사용 가능 금액',
            value: `${Math.round(dailyBudget).toLocaleString()}원`,
            note: `남은 일수 ${remainingDays}일 기준`,
          },
          {
            title: '오늘 지출 금액',
            value: `${Math.round(todaySpent).toLocaleString()}원`,
            note: '오늘 기록된 소비',
          },
          {
            title: '고정지출 요약',
            value: `${Math.round(fixedExpenseTotal).toLocaleString()}원`,
            note: '고정지출과 정기지출 포함',
          },
        ]}
      />

      <div className="grid-2">
        <article className="card stack">
          <h2 className="section-title">빠른 이동</h2>
          <div className="form-actions">
            <PrimaryButton to="/expense-records">지출 입력</PrimaryButton>
            <PrimaryButton to="/budget-settings" variant="ghost">
              예산 설정
            </PrimaryButton>
          </div>
        </article>

        <article className="card stack">
          <h2 className="section-title">상태 안내</h2>
          <p className="muted">
            안전 / 주의 / 위험 / 초과 상태를 텍스트와 색상으로 함께 보여 줍니다. 필요할 때만
            세부 화면으로 이동하면 됩니다.
          </p>
          <Link className="muted" to="/statistics">
            분석 보기
          </Link>
        </article>
      </div>
    </section>
  );
}
