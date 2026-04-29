import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home';

function renderHome(props) {
  return render(
    <MemoryRouter>
      <Home
        dailyBudget={50000}
        todaySpent={12000}
        alertState={{ key: 'safe', label: '안전', description: '여유가 있어요' }}
        alertDismissed={false}
        fixedExpenseTotal={30000}
        remainingDays={20}
        currentUser={null}
        hasBudgetSetup
        onDismissAlert={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('shows a large judgment message above the status badge', () => {
    renderHome();

    expect(screen.getByText('오늘 38,000원 더 쓸 수 있어요')).toBeInTheDocument();
    expect(screen.getByText('안전')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '알림 기록 보기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '예산 설정' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '분석 보러가기' })).toBeInTheDocument();
  });

  it('shows budget setup required message when budget settings are missing', () => {
    renderHome({
      dailyBudget: 0,
      todaySpent: 0,
      alertState: { key: 'safe', label: '안전', description: '여유가 있어요' },
      hasBudgetSetup: false,
    });

    expect(screen.getByText('예산 설정이 필요해요')).toBeInTheDocument();
    expect(screen.getByText('입력한 예산을 저장하면 오늘 소비 가능 여부를 바로 판단할 수 있어요.')).toBeInTheDocument();
  });

  it('toggles the alert banner without persisting dismissal across refresh', () => {
    renderHome({
      alertState: { key: 'danger', label: '위험', description: '오늘은 지출을 조심해 주세요.' },
    });

    expect(screen.getByText('오늘은 지출을 조심해 주세요.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '접기' }));

    expect(screen.queryByText('오늘은 지출을 조심해 주세요.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '펼치기' })).toBeInTheDocument();
  });

  it('opens the alert history panel and shows saved alert items', () => {
    renderHome({
      alertHistory: [
        {
          id: '1',
          statusKey: 'over',
          statusLabel: '초과',
          message: '오늘 예산을 초과했어요',
          relatedAmount: 12000,
          createdAt: '2026-04-29T09:00:00.000Z',
          read: false,
        },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: '알림 기록 보기' }));

    expect(screen.getByRole('dialog', { name: '알림 기록' })).toBeInTheDocument();
    expect(screen.getByText('오늘 예산을 초과했어요')).toBeInTheDocument();
    expect(screen.getByText('12,000원')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 삭제' })).toBeInTheDocument();
  });
});
