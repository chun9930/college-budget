# 지출 기록 UI 문구 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지출 기록 화면의 개발자 용어를 사용자 중심 용어로 바꾸되, 기능 구조와 동작은 그대로 유지한다.

**Architecture:** `ExpenseRecords.jsx`의 섹션 제목과 안내 문구만 바꾸고, 저장/수정/삭제/최근 기록 자동 입력/정기지출 관리 로직은 그대로 둔다. README는 지출 기록 섹션의 실제 UI 문구와 맞는 부분만 갱신한다.

**Tech Stack:** React, JavaScript, Markdown

---

### Task 1: 지출 기록 화면 문구 변경

**Files:**
- Modify: `src/pages/ExpenseRecords.jsx`

- [ ] **Step 1: `MVP 입력`을 `지출 기록`으로 바꾼다**

```jsx
<h2 className="section-title">지출 기록</h2>
```

- [ ] **Step 2: `정기지출 등록`을 `정기지출 관리`로 바꾼다**

```jsx
<h2 className="section-title">정기지출 관리</h2>
```

- [ ] **Step 3: 같은 의미의 안내 문구도 사용자 용어로 맞춘다**

```jsx
<p className="page-subtitle">
  지출 기록은 최소 입력으로 빠르게 적고, 최근 기록과 정기지출로 다시 입력할 수 있습니다.
</p>
```

### Task 2: README 문구 동기화

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 지출 기록 섹션의 제목과 하위 문구를 실제 UI와 맞춘다**

```markdown
### 지출 기록

- 지출 기록
- 정기지출 관리
```

- [ ] **Step 2: 고급 옵션과 최근 기록 섹션은 기존 기능 설명을 유지한다**

```markdown
- 고급 옵션은 지출 유형과 메모를 입력할 때 사용한다.
- 최근 기록은 빠른 입력을 위한 보조 영역이다.
```

### Task 3: 일일 로그 기록

**Files:**
- Modify: `daily-log/2026-04-28.md`

- [ ] **Step 1: 오늘 한 일에 문구 정리 내용을 추가한다**
- [ ] **Step 2: 다음에 해야할 일에 브라우저 확인 여부를 적는다**
- [ ] **Step 3: 깃허브 푸시기록에 이번 작업 커밋 정보를 누적한다**

