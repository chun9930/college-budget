import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login';

describe('Login', () => {
  it('shows placeholders and validates email format', () => {
    render(<Login currentUser={null} onLogin={vi.fn()} />);

    expect(screen.getByLabelText('이메일')).toHaveAttribute('placeholder', '이메일을 입력하세요');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('placeholder', '비밀번호를 입력하세요');

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1234' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByText('올바른 이메일 형식으로 입력해주세요.')).toBeInTheDocument();
  });

  it('shows the test account helper box', () => {
    render(<Login currentUser={null} onLogin={vi.fn()} />);

    expect(screen.getByRole('region', { name: '테스트 계정 안내' })).toBeInTheDocument();
    expect(screen.getByText('1234@naver.com')).toBeInTheDocument();
    expect(screen.getByText('student@pingo.com')).toBeInTheDocument();
  });

  it('navigates to home after login success', () => {
    const onLogin = vi.fn(() => ({ ok: true }));

    render(
      <MemoryRouter initialEntries={['/login']} >
        <Routes>
          <Route path="/login" element={<Login currentUser={null} onLogin={onLogin} />} />
          <Route path="/" element={<div>홈 페이지</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1234' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByText('홈 페이지')).toBeInTheDocument();
  });
});
