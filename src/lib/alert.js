export const ALERT_LABELS = {
  safe: '안전',
  caution: '주의',
  danger: '위험',
  over: '초과',
};

export function getAlertState({ spent = 0, dailyBudget = 0 } = {}) {
  const budget = Number(dailyBudget);
  const used = Number(spent);

  if (!Number.isFinite(budget) || budget <= 0) {
    return used > 0
      ? { key: 'over', label: ALERT_LABELS.over, description: '예산이 없어 초과 상태로 봅니다.' }
      : { key: 'safe', label: ALERT_LABELS.safe, description: '예산을 입력하면 상태를 계산합니다.' };
  }

  const usageRate = used / budget;

  if (usageRate >= 1) {
    return {
      key: 'over',
      label: ALERT_LABELS.over,
      description: '오늘 예산을 초과했습니다.',
    };
  }

  if (usageRate >= 0.9) {
    return {
      key: 'danger',
      label: ALERT_LABELS.danger,
      description: '오늘 예산의 90% 이상을 사용했습니다.',
    };
  }

  if (usageRate >= 0.7) {
    return {
      key: 'caution',
      label: ALERT_LABELS.caution,
      description: '오늘 예산의 70% 이상을 사용했습니다.',
    };
  }

  return {
    key: 'safe',
    label: ALERT_LABELS.safe,
    description: '예산이 아직 여유롭습니다.',
  };
}

export function getHomeJudgmentSnapshot({
  hasBudgetSetup = false,
  alertState = {},
  dailyBudget = 0,
  todaySpent = 0,
} = {}) {
  const budget = Number(dailyBudget) || 0;
  const spent = Number(todaySpent) || 0;
  const spentRatio = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const remainingAmount = Math.max(Math.round(budget - spent), 0);
  const exceededAmount = Math.max(Math.round(spent - budget), 0);

  if (!hasBudgetSetup) {
    return {
      statusKey: 'setup',
      statusLabel: '설정 필요',
      message: '예산 설정이 필요해요',
      description: '예산을 저장해야 오늘 사용 가능 금액을 정확하게 계산할 수 있어요.',
      relatedAmount: null,
    };
  }

  if (alertState.key === 'over') {
    return {
      statusKey: 'over',
      statusLabel: ALERT_LABELS.over,
      message: '오늘 예산을 초과했어요',
      description: '지금 소비는 권장되지 않습니다.',
      relatedAmount: exceededAmount,
    };
  }

  if (alertState.key === 'safe') {
    return {
      statusKey: 'safe',
      statusLabel: ALERT_LABELS.safe,
      message: `오늘 ${remainingAmount.toLocaleString()}원 더 쓸 수 있어요`,
      description: '지금은 여유가 있어요. 필요한 지출만 먼저 입력해 보세요.',
      relatedAmount: remainingAmount,
    };
  }

  return {
    statusKey: alertState.key || 'caution',
    statusLabel: alertState.label || ALERT_LABELS.caution,
    message: `오늘 예산의 ${spentRatio}%를 사용했어요`,
    description: '추가 소비는 한 번 더 확인해 주세요.',
    relatedAmount: spent,
  };
}
