# Home Alert History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 상단에 종소리 아이콘 기반 알림 기록 패널을 추가해, 소비 판단/경고 메시지를 앱 내부 기록으로 다시 확인할 수 있게 한다.

**Architecture:** `App.jsx`가 `alertHistory`를 localStorage로 저장/갱신하고, `Home.jsx`는 종소리 버튼과 패널만 렌더링한다. 판단 메시지 생성 로직은 `lib/alert.js`의 공유 헬퍼로 묶어 홈 문구와 기록 데이터를 같은 규칙으로 만든다.

**Tech Stack:** React, localStorage, 기존 `alertState` 계산 로직, CSS

---

### Task 1: localStorage 키와 알림 기록 헬퍼 추가

**Files:**
- Modify: `src/lib/storage.js`
- Modify: `src/lib/alert.js`
- Test: `src/pages/Home.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('records alert history snapshots with the same status and message format', () => {
  // alert snapshot helper should return a consistent object for home and history
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec esbuild -- src/pages/Home.test.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`
Expected: fail because helper/data shape is not present yet.

- [ ] **Step 3: Write minimal implementation**

```js
export const KEYS = {
  // ...
  alertHistory: 'alertHistory',
};

export function buildHomeJudgmentSnapshot({
  hasBudgetSetup = false,
  alertState = {},
  dailyBudget = 0,
  todaySpent = 0,
} = {}) {
  const safeBudget = Number(dailyBudget) || 0;
  const safeSpent = Number(todaySpent) || 0;
  const spentRatio = safeBudget > 0 ? Math.round((safeSpent / safeBudget) * 100) : 0;

  if (!hasBudgetSetup) {
    return {
      statusKey: 'setup',
      statusLabel: '설정 필요',
      message: '예산 설정이 필요해요',
      description: '예산을 저장해야 오늘 사용 가능 금액을 정확하게 계산할 수 있어요.',
      relatedAmount: null,
    };
  }

  if (alertState.key === 'over') {
    return {
      statusKey: 'over',
      statusLabel: '초과',
      message: '오늘 예산을 초과했어요',
      description: '지금 소비는 권장되지 않습니다.',
      relatedAmount: Math.max(safeSpent - safeBudget, 0),
    };
  }

  if (alertState.key === 'safe') {
    return {
      statusKey: 'safe',
      statusLabel: '안전',
      message: `오늘 ${Math.max(Math.round(safeBudget - safeSpent), 0).toLocaleString()}원 더 쓸 수 있어요`,
      description: '지금은 여유가 있어요. 필요한 지출만 먼저 입력해 보세요.',
      relatedAmount: Math.max(safeBudget - safeSpent, 0),
    };
  }

  return {
    statusKey: alertState.key || 'caution',
    statusLabel: alertState.label || '주의',
    message: `오늘 예산의 ${spentRatio}%를 사용했어요`,
    description: '추가 소비는 한 번 더 확인해 주세요.',
    relatedAmount: safeSpent,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec esbuild -- src/pages/Home.test.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`
Expected: PASS once helper shape is available.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.js src/lib/alert.js src/pages/Home.test.jsx
git commit -m "feat: add home alert history snapshot helper"
```

### Task 2: App alert history state and persistence

**Files:**
- Modify: `src/App.jsx`
- Test: `src/pages/Home.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('adds a new alert history entry when the home judgment changes', () => {
  // App should persist alertHistory with max 20 items and no consecutive duplicates
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec esbuild -- src/App.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`
Expected: fail until alertHistory state is wired.

- [ ] **Step 3: Write minimal implementation**

```jsx
const [alertHistory, setAlertHistory] = useState(() => loadJSON(KEYS.alertHistory, []));

useEffect(() => {
  saveJSON(KEYS.alertHistory, alertHistory);
}, [alertHistory]);

useEffect(() => {
  const snapshot = buildHomeJudgmentSnapshot({
    hasBudgetSetup,
    alertState,
    dailyBudget,
    todaySpent,
  });

  setAlertHistory((current) => {
    const latest = current[0];
    if (
      latest &&
      latest.statusKey === snapshot.statusKey &&
      latest.message === snapshot.message
    ) {
      return current;
    }

    return [
      {
        id: crypto.randomUUID(),
        statusKey: snapshot.statusKey,
        statusLabel: snapshot.statusLabel,
        message: snapshot.message,
        relatedAmount: snapshot.relatedAmount,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...current,
    ].slice(0, 20);
  });
}, [alertState.key, alertState.label, alertState.description, dailyBudget, hasBudgetSetup, todaySpent]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec esbuild -- src/App.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`
Expected: PASS after state wiring.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: persist home alert history in app state"
```

### Task 3: Home bell button and alert history panel

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/index.css`
- Test: `src/pages/Home.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
it('opens the alert history panel from the bell button', () => {
  // bell button aria-label and panel content should be visible
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd exec esbuild -- src/pages/Home.jsx src/pages/Home.test.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`
Expected: fail until the bell button and panel exist.

- [ ] **Step 3: Write minimal implementation**

```jsx
<button type="button" aria-label="알림 기록 보기">🔔</button>

{isAlertPanelOpen ? (
  <section className="home-alert-panel">
    <div className="home-alert-panel__header">
      <strong>알림 기록</strong>
      <button type="button" onClick={clearAlertHistory}>전체 삭제</button>
    </div>
    <ul>
      {alertHistory.map((item) => (
        <li key={item.id}>
          <strong>{item.statusLabel}</strong>
          <p>{item.message}</p>
          <small>{item.createdAt}</small>
          {item.relatedAmount ? <small>{item.relatedAmount.toLocaleString()}원</small> : null}
        </li>
      ))}
    </ul>
  </section>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd exec esbuild -- src/pages/Home.jsx src/pages/Home.test.jsx --loader:.jsx=jsx --outdir=tmp-check --log-level=error`
Expected: PASS once panel and button are wired.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/index.css src/pages/Home.test.jsx
git commit -m "feat: add home alert history panel"
```

### Task 4: README and daily log sync

**Files:**
- Modify: `README.md`
- Modify: `daily-log/2026-04-29.md`

- [ ] **Step 1: Verify docs reflect actual behavior**
- [ ] **Step 2: Update only the relevant sections**
- [ ] **Step 3: Append the daily log with today’s work**
- [ ] **Step 4: Verify no unrelated README sections changed**
- [ ] **Step 5: Commit**

```bash
git add README.md daily-log/2026-04-29.md
git commit -m "docs: document home alert history behavior"
```
