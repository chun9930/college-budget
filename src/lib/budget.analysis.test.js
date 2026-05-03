import { describe, expect, it } from 'vitest';
import {
  getCategorySpendingSummary,
  getMonthlySpendingComparison,
  getOverspendingFeedback,
  getToday,
  getStudentSavingsTips,
} from './budget';

function createRecord(date, amount, category, extra = {}) {
  return {
    id: `${date}-${category}-${amount}`,
    date,
    amount: String(amount),
    category,
    paymentMethod: '카드',
    type: '일반',
    memo: '',
    ...extra,
  };
}

describe('consumption pattern analysis helpers', () => {
  it('normalizes a date to the start of the day', () => {
    const normalized = getToday(new Date('2026-04-10T18:45:30'));

    expect(normalized.getFullYear()).toBe(2026);
    expect(normalized.getMonth()).toBe(3);
    expect(normalized.getDate()).toBe(10);
    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
  });

  it('returns safe values when there are no records', () => {
    const summary = getCategorySpendingSummary([], new Date('2026-04-30T09:00:00'));
    const comparison = getMonthlySpendingComparison([], new Date('2026-04-30T09:00:00'));
    const feedback = getOverspendingFeedback(summary, comparison);

    expect(summary.monthlyTotal).toBe(0);
    expect(summary.categoryEntries).toEqual([]);
    expect(summary.topCategory).toEqual({
      category: '기타',
      amount: 0,
      ratio: 0,
    });
    expect(feedback[0].title).toBe('분석할 지출 기록이 더 필요합니다');
  });

  it('flags a category when it takes 40 percent or more of monthly spending', () => {
    const summary = getCategorySpendingSummary(
      [
        createRecord('2026-04-01T09:00:00', 52000, '식비'),
        createRecord('2026-04-02T09:00:00', 18000, '교통'),
        createRecord('2026-04-03T09:00:00', 30000, '식비'),
      ],
      new Date('2026-04-30T09:00:00')
    );

    expect(summary.topCategory.category).toBe('식비');
    expect(summary.topCategoryRatio).toBeGreaterThanOrEqual(40);
  });

  it('compares the current month against the previous month', () => {
    const comparison = getMonthlySpendingComparison(
      [
        createRecord('2026-03-10T09:00:00', 10000, '카페'),
        createRecord('2026-04-10T09:00:00', 20000, '카페'),
        createRecord('2026-04-11T09:00:00', 5000, '식비'),
      ],
      new Date('2026-04-30T09:00:00')
    );

    expect(comparison.currentMonthTotal).toBe(25000);
    expect(comparison.previousMonthTotal).toBe(10000);
    expect(comparison.changeAmount).toBe(15000);
    expect(comparison.biggestIncreaseCategory.category).toBe('카페');
    expect(comparison.biggestIncreaseCategory.changeAmount).toBe(10000);
  });

  it('can exclude auto recurring records from the analysis summary', () => {
    const summary = getCategorySpendingSummary(
      [
        createRecord('2026-04-01T09:00:00', 40000, '식비'),
        createRecord('2026-04-02T09:00:00', 15000, '통신', { sourceRecurringId: 'r1' }),
      ],
      new Date('2026-04-30T09:00:00'),
      { includeRecurringSource: false }
    );

    expect(summary.monthlyTotal).toBe(40000);
    expect(summary.recordsCount).toBe(1);
    expect(summary.hasRecurringSourceRecords).toBe(false);
  });

  it('returns a student savings tip for the top category when it is 40 percent or more', () => {
    const summary = getCategorySpendingSummary(
      [
        createRecord('2026-05-01T09:00:00', 50000, '식비'),
        createRecord('2026-05-02T09:00:00', 20000, '교통'),
        createRecord('2026-05-03T09:00:00', 10000, '식비'),
      ],
      new Date('2026-05-01T09:00:00')
    );
    const comparison = getMonthlySpendingComparison([], new Date('2026-05-01T09:00:00'));

    const tips = getStudentSavingsTips(summary, comparison);

    expect(tips[0].category).toBe('식비');
    expect(tips[0].reason).toContain('식비');
    expect(tips[0].action.length).toBeGreaterThan(0);
  });

  it('maps cafe spending to cafe-specific savings tips', () => {
    const summary = getCategorySpendingSummary(
      [
        createRecord('2026-05-01T09:00:00', 30000, '카페'),
        createRecord('2026-05-02T09:00:00', 10000, '식비'),
      ],
      new Date('2026-05-01T09:00:00')
    );
    const comparison = getMonthlySpendingComparison([], new Date('2026-05-01T09:00:00'));

    const tips = getStudentSavingsTips(summary, comparison);

    expect(tips[0].category).toBe('카페');
    expect(tips[0].action).toContain('텀블러 할인');
  });

  it('returns general tips when there are not enough records', () => {
    const summary = getCategorySpendingSummary([], new Date('2026-05-01T09:00:00'));
    const comparison = getMonthlySpendingComparison([], new Date('2026-05-01T09:00:00'));

    const tips = getStudentSavingsTips(summary, comparison);

    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0].category).toBe('전체');
  });
});
