import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Signup from './Signup';

describe('Signup', () => {
  it('shows placeholders and validates email format', () => {
    render(<Signup currentUser={null} onSignup={vi.fn()} />);

    expect(screen.getByLabelText('사용자 이름')).toHaveAttribute('placeholder', '이름을 입력하세요');
    expect(screen.getByLabelText('이메일')).toHaveAttribute('placeholder', 'example@email.com');
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('placeholder', '비밀번호를 입력하세요');
    expect(screen.getByLabelText('비밀번호 확인')).toHaveAttribute(
      'placeholder',
      '비밀번호를 다시 입력하세요'
    );

    fireEvent.change(screen.getByLabelText('사용자 이름'), { target: { value: '테스트' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1234' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password1234' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    expect(screen.getByText('올바른 이메일 형식으로 입력해주세요.')).toBeInTheDocument();
  });

  it('navigates to login after signup success without auto login', () => {
    const onSignup = vi.fn(() => ({ ok: true }));

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<Signup currentUser={null} onSignup={onSignup} />} />
          <Route path="/login" element={<div>로그인 페이지</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('사용자 이름'), { target: { value: '테스트' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password1234' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password1234' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
  });
});
