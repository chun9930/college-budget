# 달력 월합계 및 수정 연결 계획

## 목표
- 캘린더 화면에서 `달력 보기` 버튼의 위치와 크기를 원래의 작은 pill 형태로 되돌린다.
- `달력 보기` 바로 아래에 해당 월의 지출 합계를 표시한다.
- 달력의 지출 항목을 클릭하면 해당 기록의 수정/삭제 화면으로 이동한다.

## 범위
- `src/pages/Calendar.jsx`
- `src/pages/ExpenseRecords.jsx`
- `src/pages/Calendar.test.jsx`
- `src/pages/ExpenseRecords.test.jsx`
- `src/index.css`

## 제외
- 지출 저장/수정/삭제 로직 변경 금지
- 정기지출 로직 변경 금지
- 선택 날짜 저장 로직 변경 금지
- 분석 페이지 변경 금지

## 작업 순서
1. `calendar-toggle-wrap`와 `calendar-month-total`의 배치 및 크기를 조정한다.
2. 달력의 지출 항목 클릭 시 기존 수정 모드로 연결되는 흐름을 확인한다.
3. Calendar / ExpenseRecords 테스트를 라우터 환경에 맞게 정리한다.
4. README와 일일 로그를 실제 변경한 부분만 갱신한다.

