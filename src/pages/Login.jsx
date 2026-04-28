import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

const DEFAULT_FORM = {
  email: '',
  password: '',
};

export default function Login({ currentUser, onLogin }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, []);

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
    const result = onLogin(formState);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/my-page');
  };

  return (
    <section className="page-stack narrow">
      <div className="page-hero">
        <div>
          <h1 className="page-title">로그인</h1>
          <p className="page-subtitle">mock auth로 이메일과 비밀번호만 확인합니다.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <FormField id="login-email" label="이메일">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={formState.email}
            onChange={updateField('email')}
          />
        </FormField>

        <FormField id="login-password" label="비밀번호">
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={formState.password}
            onChange={updateField('password')}
          />
        </FormField>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="form-actions">
          <PrimaryButton type="submit">로그인</PrimaryButton>
          <Link className="primary-button ghost" to="/signup">
            회원가입
          </Link>
        </div>
      </form>
    </section>
  );
}
