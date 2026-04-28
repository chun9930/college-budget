import { Link } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import SummaryCard from '../components/SummaryCard';

export default function Home({
  dailyBudget,
  todaySpent,
  alertState,
  alertDismissed,
  fixedExpenseTotal,
  remainingDays,
  onDismissAlert,
}) {
  const shouldShowBanner = !alertDismissed && alertState.key !== 'safe';

  return (
    <section className="page-stack">
      <div className="page-hero">
        <div>
          <h1 className="page-title">오늘 현황</h1>
          <p className="page-subtitle">
            오늘 소비 가능 여부를 빠르게 확인하고, 필요한 경우 바로 예산 설정과 지출 입력으로
            이동합니다.
          </p>
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

      <div className="grid-3">
        <SummaryCard
          title="오늘 사용 가능 금액"
          value={`${Math.round(dailyBudget).toLocaleString()}원`}
          note={`남은 일수 ${remainingDays}일 기준`}
        />
        <SummaryCard
          title="오늘 지출 금액"
          value={`${Math.round(todaySpent).toLocaleString()}원`}
          note="오늘 기록된 소비"
        />
        <SummaryCard
          title="고정지출 요약"
          value={`${Math.round(fixedExpenseTotal).toLocaleString()}원`}
          note="정기지출 포함 월 고정비"
        />
      </div>

      <div className="grid-2">
        <article className="card stack">
          <h2 className="section-title">빠른 이동</h2>
          <div className="form-actions">
            <PrimaryButton to="/expense-records">지출 입력</PrimaryButton>
            <PrimaryButton to="/budget-settings" variant="ghost">
              수입 / 예산 설정
            </PrimaryButton>
          </div>
        </article>

        <article className="card stack">
          <h2 className="section-title">요약</h2>
          <p className="muted">
            오늘 예산과 비교해 소비 가능 여부를 바로 판단합니다. 필요할 때만 상세 화면으로 이동해
            기록과 분석을 확인하세요.
          </p>
          <Link className="muted" to="/statistics">
            월별 분석 보기 →
          </Link>
        </article>
      </div>
    </section>
  );
}
