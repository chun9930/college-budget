import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import Statistics from './Statistics';

function createRecord(date, amount, category) {
  return {
    id: `${date}-${category}-${amount}`,
    amount,
    category,
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    date,
  };
}

describe('Statistics', () => {
  it('shows the monthly total, daily chart, category ratio, top category, and hints', () => {
    render(
      <Statistics
        expenseRecords={[
          createRecord('2026-04-01T00:00:00', 12000, '식비'),
          createRecord('2026-04-01T12:00:00', 8000, '식비'),
          createRecord('2026-04-02T00:00:00', 5000, '교통'),
          createRecord('2026-04-03T00:00:00', 15000, '쇼핑'),
        ]}
      />
    );

    expect(screen.getByText('이번 달 40,000원 썼어요')).toBeInTheDocument();
    expect(screen.getByText('저장된 지출 기록 기준입니다')).toBeInTheDocument();

    const dailyChart = screen.getByLabelText('일별 지출 막대 차트');
    expect(dailyChart.children.length).toBe(3);

    expect(screen.getByText('식비')).toBeInTheDocument();
    expect(screen.getByText('50% · 20,000원')).toBeInTheDocument();
    expect(screen.getByText('쇼핑')).toBeInTheDocument();
    expect(screen.getByText('이번 달 가장 많이 쓴 항목은 식비예요.')).toBeInTheDocument();
    expect(screen.getByText('가장 큰 지출 카테고리부터 확인해보세요.')).toBeInTheDocument();
  });

  it('shows empty state when there are no expense records', () => {
    render(<Statistics expenseRecords={[]} />);

    expect(screen.getByText('분석할 기록이 없습니다')).toBeInTheDocument();
    expect(
      screen.getByText('지출을 저장하면 이번 달 총 지출, 일별 막대, 카테고리 비중을 볼 수 있습니다.')
    ).toBeInTheDocument();
  });
});
