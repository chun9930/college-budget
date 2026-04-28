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
      ? { key: 'over', label: ALERT_LABELS.over, description: '예산을 계산할 수 없습니다.' }
      : { key: 'safe', label: ALERT_LABELS.safe, description: '예산이 준비되었습니다.' };
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
    description: '예산이 안정적입니다.',
  };
}

