# Statistics 페이지 재배치 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `expenseRecords`만 사용해서 Statistics 페이지를 이번 달 총지출 중심의 숫자 우선 화면으로 재배치한다.

**Architecture:** 기존 `Statistics.jsx`의 계산 로직을 재사용하되, 화면 순서를 `총 지출 요약 -> 일별 막대 -> 카테고리 비중 -> 가장 많이 쓴 항목 -> 절약 힌트`로 바꾼다. 차트 라이브러리는 추가하지 않고, CSS 막대와 리스트만으로 정보를 표현한다.

**Tech Stack:** React, JavaScript, CSS

---

### Task 1: Statistics 데이터 계산 정리

**Files:**
- Modify: `src/pages/Statistics.jsx`

- [ ] **Step 1: 이번 달 기록, 총지출, 일별 합계, 카테고리 합계를 계산한다**

```javascript
const currentMonthRecords = expenseRecords.filter(
  (record) => getMonthKey(record.date) === currentMonthKey
);

const monthlyTotal = currentMonthRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
```

- [ ] **Step 2: 일별 지출 합계를 `YYYY-MM-DD -> amount` 형태로 만든다**

```javascript
const dailyTotals = currentMonthRecords.reduce((accumulator, record) => {
  const dateKey = record.date.slice(0, 10);
  accumulator[dateKey] = (accumulator[dateKey] || 0) + Number(record.amount || 0);
  return accumulator;
}, {});
```

- [ ] **Step 3: 카테고리별 합계를 큰 순서로 정렬한다**

```javascript
const categoryEntries = Object.entries(categoryMap).sort((left, right) => right[1] - left[1]);
```

### Task 2: Statistics 화면 재배치

**Files:**
- Modify: `src/pages/Statistics.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: 상단 제목과 총지출 요약을 먼저 보여준다**

```jsx
<div className="statistics-hero">
  <h1 className="page-title">분석</h1>
  <p className="statistics-total">{Math.round(summary.monthlyTotal).toLocaleString()}원</p>
  <p className="page-subtitle">저장된 지출 기록 기준입니다</p>
</div>
```

- [ ] **Step 2: 일별 지출 막대를 CSS div로 렌더링한다**

```jsx
<div className="daily-bars" aria-label="일별 지출 막대 차트">
  {dailyEntries.map(([dateKey, amount]) => {
    const height = monthlyTotal > 0 ? Math.max((amount / monthlyTotal) * 100, 8) : 8;
    return <span key={dateKey} style={{ height: `${height}%` }} />;
  })}
</div>
```

- [ ] **Step 3: 카테고리별 비중 리스트를 금액 순으로 렌더링한다**

```jsx
<div className="list">
  {categoryEntries.map(([category, amount]) => {
    const ratio = monthlyTotal > 0 ? Math.round((amount / monthlyTotal) * 100) : 0;
    return (
      <div key={category} className="list-item">
        <strong>{category}</strong>
        <span className="muted">{ratio}% · {Math.round(amount).toLocaleString()}원</span>
      </div>
    );
  })}
</div>
```

- [ ] **Step 4: 가장 많이 쓴 항목과 절약 힌트를 한 문장씩 보여준다**

```jsx
<p>이번 달 가장 많이 쓴 항목은 {topCategory[0]}예요.</p>
<p>가장 큰 지출 카테고리부터 확인해보세요.</p>
```

### Task 3: 테스트와 문서 반영

**Files:**
- Modify: `src/pages/Statistics.jsx`
- Create: `src/pages/Statistics.test.jsx`
- Modify: `README.md`
- Modify: `daily-log/2026-04-28.md`

- [ ] **Step 1: 빈 데이터와 유효 데이터 렌더를 검증하는 테스트를 작성한다**

```javascript
expect(screen.getByText(/이번 달/)).toBeInTheDocument();
expect(screen.getByText('분석할 기록이 없습니다')).toBeInTheDocument();
```

- [ ] **Step 2: README의 분석 리포트 섹션만 갱신한다**

```markdown
- 이번 달 총 지출을 가장 먼저 보여준다.
- 일별 지출 막대와 카테고리 비중을 순서대로 보여준다.
```

- [ ] **Step 3: 일일 로그에 작업 내용과 검증 결과를 추가한다**

Run: `git diff --check`
Expected: 치명적인 patch 오류 없음.

