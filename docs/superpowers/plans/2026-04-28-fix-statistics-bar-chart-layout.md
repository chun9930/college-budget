# Statistics 막대 차트 레이아웃 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statistics 페이지의 CSS 막대 차트가 영역 밖으로 넘치지 않도록 정리하고, 모바일/데스크톱 모두에서 안정적인 레이아웃을 유지한다.

**Architecture:** `Statistics.jsx`의 계산 로직과 데이터 구조는 그대로 두고, `src/index.css`의 차트 관련 스타일만 조정한다. 필요하면 막대 래퍼와 라벨 간격 정도만 최소 보강한다.

**Tech Stack:** CSS, React

---

### Task 1: 차트 래퍼 안정화

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 일별 막대 차트 래퍼의 overflow와 padding을 정리한다**

```css
.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  min-height: 180px;
  padding: 12px 4px 4px;
  overflow: hidden;
}
```

- [ ] **Step 2: 각 막대 항목의 너비를 일정하게 맞춘다**

```css
.daily-chart__item {
  flex: 1 1 0;
  min-width: 0;
  display: grid;
  gap: 8px;
  justify-items: center;
}
```

### Task 2: 막대와 라벨 정리

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 막대 높이와 라벨을 안정화한다**

```css
.daily-chart__bar {
  width: 100%;
  height: 140px;
  min-height: 140px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.daily-chart__label {
  font-size: 0.68rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 2: 막대 안쪽 span이 영역 밖으로 튀어나오지 않게 한다**

```css
.daily-chart__bar > span {
  width: 100%;
  max-height: 100%;
}
```

### Task 3: 모바일/데스크톱 반응형 보정

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 모바일에서는 가로 스크롤이 생기지 않게 한다**

```css
@media (max-width: 720px) {
  .daily-chart {
    gap: 8px;
    min-height: 160px;
  }

  .daily-chart__amount {
    font-size: 0.7rem;
  }
}
```

- [ ] **Step 2: 데스크톱에서는 과하게 넓게 퍼지지 않도록 최대 폭을 둔다**

```css
.daily-chart {
  max-width: 100%;
}
```

### Task 4: 검증

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: CSS 문법과 patch 오류를 확인한다**

Run: `git diff --check`
Expected: 치명적인 patch 오류 없음.

