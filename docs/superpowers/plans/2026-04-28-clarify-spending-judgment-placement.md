# 소비 판단 위치 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈은 현재 소비 상태를 크게 보여주고, 지출 기록은 입력 중인 금액의 소비 가능 여부를 미리 보여주며, 분석은 요약만 유지한다.

**Architecture:** `Home.jsx`는 판단 문장을 hero 영역의 주 메시지로 바꾸고, `ExpenseRecords.jsx`는 금액 입력값을 기준으로 저장 전 판단 문구를 추가한다. `Statistics.jsx`는 현 구조를 유지해 경고/판단 표현을 넣지 않는다.

**Tech Stack:** React, JavaScript, Markdown

---

### Task 1: Home 판단 문장 재배치

**Files:**
- Modify: `src/pages/Home.jsx`
- Test: `src/pages/Home.test.jsx` 또는 기존 홈 렌더 테스트가 있으면 그 파일

- [ ] **Step 1: 홈 hero 상단에 판단 문장을 만든다**

```jsx
const judgmentMessage = shouldShowBudgetSetupRequired
  ? '예산 설정이 필요해요'
  : alertState.key === 'over'
    ? '오늘 예산을 초과했어요'
    : alertState.key === 'safe'
      ? `오늘 ${Math.round(dailyBudget).toLocaleString()}원 더 쓸 수 있어요`
      : `오늘 예산의 ${spentRatio}%를 사용했어요`;
```

- [ ] **Step 2: 상태 배지를 판단 문장 아래에 둔다**

```jsx
<h2 className="home-judgment">{judgmentMessage}</h2>
<StatusBadge label={alertState.label} tone={alertState.key} />
```

- [ ] **Step 3: 예산 설정이 없을 때 강조 문구와 버튼을 노출한다**

```jsx
{!hasBudgetSettings ? (
  <div className="alert-banner warning">
    <p>예산 설정이 필요해요</p>
    <PrimaryButton to="/budget-settings">예산 설정</PrimaryButton>
  </div>
) : null}
```

### Task 2: ExpenseRecords 입력 판단 문구 추가

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`

- [ ] **Step 1: 금액 입력값 기준의 판단 메시지를 계산한다**

```javascript
const enteredAmount = Number(recordForm.amount || 0);
const previewSpent = todaySpent + enteredAmount;
const previewState = getAlertState({ spent: previewSpent, dailyBudget });
```

- [ ] **Step 2: 금액 입력 아래에 저장 전 판단 문구를 넣는다**

```jsx
<p className="muted">
  {enteredAmount > 0
    ? previewState.key === 'over'
      ? '이 지출을 추가하면 오늘 예산을 초과합니다'
      : `이 지출을 추가해도 오늘 ${Math.round(dailyBudget - previewSpent).toLocaleString()}원 정도 남습니다`
    : '금액을 입력하면 저장 전 소비 가능 여부를 보여줍니다.'}
</p>
```

- [ ] **Step 3: 저장 로직은 그대로 유지한다**

```javascript
onAddExpenseRecord({
  ...recordForm,
  date: buildDateTimeFromDateKey(resolvedDateKey),
});
```

### Task 3: 분석 페이지 유지 및 문서 동기화

**Files:**
- Modify: `src/pages/Statistics.jsx` (문구 유지 확인만)
- Modify: `README.md`
- Modify: `daily-log/2026-04-28.md`

- [ ] **Step 1: Statistics에 판단/경고 문구를 추가하지 않는다**

```jsx
// 이번 달 총지출, 일별 막대, 카테고리 비중, 가장 많이 쓴 항목, 절약 힌트만 유지
```

- [ ] **Step 2: README의 홈/지출 기록/분석 섹션만 동기화한다**

```markdown
- 홈은 현재 소비 상태를 크게 보여주는 판단 화면이다.
- 지출 기록은 입력 중인 금액의 소비 가능 여부를 미리 보여준다.
- 분석은 저장된 지출 기록의 요약만 보여준다.
```

- [ ] **Step 3: 일일 로그에 작업 내용과 검증 결과를 추가한다**

Run: `git diff --check`
Expected: 치명적인 patch 오류 없음.

