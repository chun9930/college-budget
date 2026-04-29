import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MyPage from './MyPage';

describe('MyPage', () => {
  it('keeps the user logged in when data is reset', () => {
    const onResetData = vi.fn();

    render(
      <MemoryRouter initialEntries={['/my-page']}>
        <Routes>
          <Route
            path="/my-page"
            element={
              <MyPage
                currentUser={{ name: '홍길동', email: 'hong@example.com' }}
                budgetSettings={{
                  useManualBudget: false,
                  carryOverEnabled: true,
                  goalEnabled: true,
                  periodCalculationEnabled: true,
                }}
                savingGoalSettings={{
                  goalAmount: '1000000',
                }}
                onLogout={vi.fn()}
                onResetData={onResetData}
              />
            }
          />
          <Route path="/login" element={<div>로그인 페이지</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '데이터 초기화' }));

    expect(onResetData).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
  });
});
