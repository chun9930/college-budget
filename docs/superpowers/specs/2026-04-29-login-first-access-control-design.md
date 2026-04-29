# 로그인 우선 접근 제어 및 입력 UX 디자인 명세

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비로그인 사용자는 로그인/회원가입만 볼 수 있게 하고, 로그인 성공 후에만 앱 주요 페이지에 접근하도록 라우팅을 정리하며 로그인/회원가입 입력 UX를 보강한다.

**Architecture:** `App.jsx`에서 `loginState`와 `userProfile`을 바탕으로 인증 여부를 판단하고, 보호 페이지는 인증이 없으면 `/login`으로 리다이렉트한다. `Header`와 `BottomNav`는 인증된 상태에서만 렌더링하며, 로그인/회원가입 페이지는 공개 페이지로 유지한다. 로그인 성공은 홈(`/`)으로, 회원가입 성공은 로그인(`/login`)으로 이동한다.

**Tech Stack:** React, React Router, localStorage, CSS, Vitest, React Testing Library

---

### Task 1: 라우트 가드와 인증 전용 레이아웃

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Header.jsx`
- Modify: `src/components/BottomNav.jsx`
- Test: `src/App.test.jsx` 또는 기존 라우팅 테스트 파일

- [ ] **Step 1: Write the failing test**

```jsx
it('redirects anonymous users to login when they open a protected route', () => {
  window.localStorage.clear();
  render(<App />);

  window.history.pushState({}, '', '/#/budget-settings');

  expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
});
```

```jsx
it('hides header and bottom nav on login and signup pages', () => {
  window.localStorage.clear();
  render(<App />);

  window.history.pushState({}, '', '/#/login');

  expect(screen.queryByRole('navigation', { name: '주요 페이지' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/App.test.jsx --pool=threads false`
Expected: 아직 인증 가드가 없어서 보호 페이지 차단 테스트가 실패한다.

- [ ] **Step 3: Write minimal implementation**

```jsx
const isAuthed = Boolean(loginState?.isLoggedIn && userProfile);
const publicPaths = ['/login', '/signup'];

function ProtectedRoute({ isAuthed, children }) {
  return isAuthed ? children : <Navigate to="/login" replace />;
}
```

```jsx
{isAuthed ? <Header currentUser={currentUser} onLogout={handleLogout} /> : null}
{isAuthed ? <BottomNav /> : null}
```

```jsx
<Route path="/login" element={<Login ... onLogin={handleLogin} />} />
<Route path="/signup" element={<Signup ... onSignup={handleSignup} />} />
<Route
  path="/"
  element={
    <ProtectedRoute isAuthed={isAuthed}>
      <Home {...sharedProps} ... />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/App.test.jsx --pool=threads false`
Expected: 비로그인 보호 라우트 차단과 인증 전용 헤더/하단 네비 숨김 테스트가 통과한다.

### Task 2: Login / Signup 입력 placeholder

**Files:**
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/Signup.jsx`
- Test: `src/pages/Login.test.jsx` 또는 `src/pages/Signup.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('shows placeholders on login inputs', () => {
  render(<Login currentUser={null} onLogin={vi.fn()} />);

  expect(screen.getByLabelText('이메일')).toHaveAttribute('placeholder', '이메일을 입력하세요');
  expect(screen.getByLabelText('비밀번호')).toHaveAttribute('placeholder', '비밀번호를 입력하세요');
});
```

```jsx
it('shows placeholders on signup inputs', () => {
  render(<Signup currentUser={null} onSignup={vi.fn()} />);

  expect(screen.getByLabelText('사용자 이름')).toHaveAttribute('placeholder', '이름을 입력하세요');
  expect(screen.getByLabelText('이메일')).toHaveAttribute('placeholder', 'example@email.com');
  expect(screen.getByLabelText('비밀번호')).toHaveAttribute('placeholder', '비밀번호를 입력하세요');
  expect(screen.getByLabelText('비밀번호 확인')).toHaveAttribute('placeholder', '비밀번호를 다시 입력하세요');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/Login.test.jsx src/pages/Signup.test.jsx --pool=threads false`
Expected: placeholder가 아직 없어서 실패한다.

- [ ] **Step 3: Write minimal implementation**

```jsx
<input placeholder="이메일을 입력하세요" ... />
<input placeholder="비밀번호를 입력하세요" ... />
```

```jsx
<input placeholder="이름을 입력하세요" ... />
<input placeholder="example@email.com" ... />
<input placeholder="비밀번호를 입력하세요" ... />
<input placeholder="비밀번호를 다시 입력하세요" ... />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/Login.test.jsx src/pages/Signup.test.jsx --pool=threads false`
Expected: placeholder 테스트가 통과한다.

### Task 3: Login / Signup success flow

**Files:**
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/Signup.jsx`
- Modify: `src/App.jsx`
- Test: `src/pages/Login.test.jsx`, `src/pages/Signup.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('redirects to home after login success', () => {
  const onLogin = vi.fn(() => ({ ok: true }));
  const navigate = vi.fn();
  // 로그인 성공 후 navigate('/')가 호출되는지 확인
});
```

```jsx
it('redirects to login after signup success without auto login', () => {
  const onSignup = vi.fn(() => ({ ok: true }));
  const navigate = vi.fn();
  // 회원가입 성공 후 navigate('/login')가 호출되는지 확인
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/pages/Login.test.jsx src/pages/Signup.test.jsx --pool=threads false`
Expected: 성공 후 라우팅 테스트가 아직 없으면 실패한다.

- [ ] **Step 3: Write minimal implementation**

```jsx
const result = onLogin(formState);
if (!result.ok) {
  setError(result.error);
  return;
}
navigate('/');
```

```jsx
const result = onSignup(formState);
if (!result.ok) {
  setError(result.error);
  return;
}
navigate('/login');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/pages/Login.test.jsx src/pages/Signup.test.jsx --pool=threads false`
Expected: 로그인은 홈으로, 회원가입은 로그인으로 이동한다.

### Task 4: Logout and storage sync

**Files:**
- Modify: `src/App.jsx`
- Test: `src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('navigates to login after logout and clears auth state', () => {
  // currentUser가 있는 상태에서 로그아웃 후 /login 이동과 state 초기화 확인
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/App.test.jsx --pool=threads false`
Expected: 로그아웃 후 이동 테스트가 아직 없으면 실패한다.

- [ ] **Step 3: Write minimal implementation**

```jsx
const handleLogout = () => {
  logout();
  setLoginState(null);
  setUserProfile(null);
};
```

```jsx
<Route path="*" element={<Navigate to={isAuthed ? '/' : '/login'} replace />} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/App.test.jsx --pool=threads false`
Expected: 로그아웃 시 auth state가 제거되고 login으로 이동한다.

### Task 5: Documentation sync

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-29.md`

- [ ] **Step 1: Write the failing test**

```md
// README와 daily-log는 구현 후에 실제 반영 내용을 확인한다.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec vitest run src/App.test.jsx src/pages/Login.test.jsx src/pages/Signup.test.jsx --pool=threads false`
Expected: 문서 반영 전에는 코드 테스트가 우선이다.

- [ ] **Step 3: Write minimal implementation**

```md
- 로그인 전에는 로그인/회원가입만 보인다.
- 로그인 성공 후에만 홈, 예산, 기록, 분석, 달력, 마이페이지에 접근할 수 있다.
- 로그인/회원가입 입력에는 placeholder가 표시된다.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec vitest run src/App.test.jsx src/pages/Login.test.jsx src/pages/Signup.test.jsx --pool=threads false`
Expected: 문서 동기화와 함께 라우팅/placeholder 테스트가 통과한다.

---

## Self-Review

### 1. Spec coverage

- 비로그인 상태에서 로그인/회원가입만 접근 가능: Task 1
- 로그인 성공 후 홈으로 이동: Task 3
- 회원가입 성공 후 로그인으로 이동: Task 3
- 로그아웃 후 로그인으로 이동: Task 4
- Header/BottomNav 숨김: Task 1
- 로그인 placeholder: Task 2
- 회원가입 placeholder: Task 2

### 2. Placeholder scan

- `TBD` 없음
- `TODO` 없음
- 경로는 실제 파일 기준
- 기능 설명은 구현 범위에 맞게 제한됨

### 3. Type consistency

- `isAuthed`를 App 전체 인증 기준으로 고정했다.
- `showToast(message, tone?)`와는 별도 흐름이라 충돌하지 않는다.
- `navigate('/')`, `navigate('/login')` 성공 라우팅 규칙을 명시했다.

