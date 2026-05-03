import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import Statistics from './Statistics';

function createRecord(date, amount, category, extra = {}) {
  return {
    id: `${date}-${category}-${amount}`,
    amount: String(amount),
    category,
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    date,
    ...extra,
  };
}

describe('Statistics', () => {
  it('shows selected month analysis and updates when month changes', () => {
    render(
      <Statistics
        currentDate={new Date('2026-05-01T09:00:00')}
        expenseRecords={[
          createRecord('2026-03-10T09:00:00', 10000, '카페'),
          createRecord('2026-04-01T09:00:00', 52000, '식비'),
          createRecord('2026-04-02T09:00:00', 18000, '교통'),
          createRecord('2026-04-03T09:00:00', 30000, '식비'),
          createRecord('2026-04-04T09:00:00', 12000, '카페', {
            sourceRecurringId: 'seed-recurring-01',
          }),
          createRecord('2026-05-05T09:00:00', 5000, '생활'),
        ]}
      />
    );

    expect(screen.getByText('2026년 5월 지출 분석')).toBeInTheDocument();
    expect(screen.getByText('선택한 달 5,000원 썼어요')).toBeInTheDocument();
    expect(screen.getByText('2026년 5월 기준')).toBeInTheDocument();
    expect(screen.getByLabelText('분석 월 선택')).toHaveValue('2026-05');

    fireEvent.change(screen.getByLabelText('분석 월 선택'), { target: { value: '2026-04' } });

    expect(screen.getByText('2026년 4월 지출 분석')).toBeInTheDocument();
    expect(screen.getByText('선택한 달 112,000원 썼어요')).toBeInTheDocument();
    expect(screen.getByText('2026년 4월 기준')).toBeInTheDocument();
    expect(screen.getByText('식비')).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes('식비가 전체 지출의') && text.includes('이번 주 지출 횟수'))
    ).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes('카페 지출이 지난달보다') && text.includes('늘었습니다'))
    ).toBeInTheDocument();
    expect(screen.getByText('대학생 절약 팁')).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes('학생식당') || text.includes('텀블러 할인'))).toBeInTheDocument();
    expect(
      screen.getByText('자동 반영된 정기지출은 기록에는 포함되지만 예산 계산에서는 중복 제외됩니다.')
    ).toBeInTheDocument();
  });

  it('shows empty state when the selected month has no records', () => {
    render(<Statistics currentDate={new Date('2026-05-01T09:00:00')} expenseRecords={[]} />);

    expect(screen.getByText('2026년 5월 지출 분석')).toBeInTheDocument();
    expect(screen.getAllByText('선택한 달에는 분석할 지출 기록이 없습니다.').length).toBeGreaterThan(0);
    expect(screen.getByText('기록이 더 쌓이면 전월 대비 변화와 패턴 분석이 더 정확해집니다.')).toBeInTheDocument();
  });
});
