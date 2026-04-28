import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

const DEFAULT_FORM = {
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

export default function Signup({ currentUser, onSignup }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');

  if (currentUser) {
    return <Navigate to="/my-page" replace />;
  }

  const updateField = (field) => (event) => {
    setFormState((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onSignup(formState);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/login');
  };

  return (
    <section className="page-stack narrow">
      <div className="page-hero">
        <div>
          <h1 className="page-title">회원가입</h1>
          <p className="page-subtitle">mock auth로 사용자 이름과 이메일을 저장합니다.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <FormField id="signup-name" label="사용자 이름">
          <input
            id="signup-name"
            value={formState.name}
            onChange={updateField('name')}
          />
        </FormField>

        <FormField id="signup-email" label="이메일">
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={formState.email}
            onChange={updateField('email')}
          />
        </FormField>

        <FormField id="signup-password" label="비밀번호">
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={formState.password}
            onChange={updateField('password')}
          />
        </FormField>

        <FormField id="signup-password-confirm" label="비밀번호 확인">
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            value={formState.passwordConfirm}
            onChange={updateField('passwordConfirm')}
          />
        </FormField>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="form-actions">
          <PrimaryButton type="submit">회원가입</PrimaryButton>
          <Link className="primary-button ghost" to="/login">
            로그인
          </Link>
        </div>
      </form>
    </section>
  );
}
