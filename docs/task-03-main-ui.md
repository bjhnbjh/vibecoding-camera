# Task 03: 메인 페이지 UI 구현 (원클릭 식단 기록 버튼)

## 📋 작업 개요
- **작업명**: 메인 페이지 UI 구현 (원클릭 식단 기록 버튼)
- **우선순위**: 높음 (사용자 인터페이스의 핵심)
- **예상 소요시간**: 4-5시간

## 🎯 목표
"마찰 없는 기록(Frictionless Logging)" 철학에 따라 사용자가 단 한 번의 클릭으로 식단 기록을 시작할 수 있는 직관적이고 간단한 메인 페이지 UI를 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **원클릭 식단 기록 버튼**
   - 화면 중앙에 눈에 띄는 큰 버튼 배치
   - 클릭 시 즉시 이미지 선택 인터페이스 실행
   - 버튼 상태에 따른 시각적 피드백

2. **인증 상태별 UI 변화**
   - 로그인 상태: 식단 기록 버튼 표시
   - 비로그인 상태: 로그인 유도 메시지 표시

3. **네비게이션**
   - 상단: 로고/제목, 사용자 정보, 로그아웃 버튼
   - 하단: 메인(현재 페이지), 나의 식단 페이지 링크

4. **반응형 디자인**
   - 모바일 우선 설계
   - 다양한 화면 크기에 대응

### 비기능적 요구사항
- **직관성**: 사용법을 설명하지 않아도 이해할 수 있는 UI
- **접근성**: 터치하기 쉬운 버튼 크기 (최소 44px)
- **성능**: 빠른 로딩과 반응성

## 🎨 UI/UX 디자인 가이드

### 컬러 팔레트
```css
:root {
  --primary-color: #10b981; /* 초록색 - 건강한 느낌 */
  --primary-hover: #059669;
  --secondary-color: #f3f4f6;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --background: #ffffff;
  --border: #e5e7eb;
}
```

### 타이포그래피
- **제목**: 28px, 굵게, 중앙 정렬
- **버튼 텍스트**: 18px, 중간 굵기
- **설명 텍스트**: 14px, 보통

### 레이아웃 구조
```
┌─────────────────────────────┐
│        Header               │
│    [로고] [사용자 정보]        │
├─────────────────────────────┤
│                             │
│        Main Content         │
│                             │
│    [큰 식단 기록 버튼]        │
│                             │
│      간단한 설명 텍스트        │
│                             │
├─────────────────────────────┤
│     Bottom Navigation       │
│   [홈] [나의 식단]           │
└─────────────────────────────┘
```

## 🛠 기술 구현 사항

### 1. 메인 페이지 컴포넌트 구조
```typescript
// app/page.tsx
export default function HomePage() {
  // 인증 상태 확인
  // 식단 기록 버튼 클릭 핸들러
  // UI 렌더링
}
```

### 2. 필요한 컴포넌트
- `MainRecordButton`: 메인 식단 기록 버튼
- `Header`: 상단 헤더 (로고, 사용자 정보)
- `BottomNavigation`: 하단 네비게이션
- `AuthPrompt`: 비로그인 시 표시되는 로그인 유도 컴포넌트

### 3. 상태 관리
```typescript
interface MainPageState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}
```

## 📱 모바일 최적화 요소

### 터치 인터랙션
- 버튼 최소 크기: 44px × 44px
- 충분한 여백 (최소 8px)
- 터치 피드백 애니메이션

### 화면 크기별 대응
```css
/* 모바일 (기본) */
.record-button {
  width: 280px;
  height: 280px;
  border-radius: 50%;
}

/* 태블릿 */
@media (min-width: 768px) {
  .record-button {
    width: 320px;
    height: 320px;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .record-button {
    width: 360px;
    height: 360px;
  }
}
```

## 🎭 인터랙션 디자인

### 버튼 상태별 스타일
1. **기본 상태**: 부드러운 그라데이션, 그림자
2. **호버 상태**: 색상 변화, 살짝 확대
3. **클릭 상태**: 눌린 효과, 색상 변화
4. **로딩 상태**: 스피너 애니메이션

### 마이크로 인터랙션
- 버튼 호버 시 부드러운 확대 효과
- 클릭 시 ripple 효과
- 페이지 로딩 시 fade-in 애니메이션

## ✅ 완료 기준 (Definition of Done)
- [x] 메인 페이지 레이아웃 구현 완료
- [x] 원클릭 식단 기록 버튼 구현 완료
- [x] 인증 상태별 UI 변화 구현 완료
- [x] 헤더 및 네비게이션 구현 완료
- [x] 모바일 반응형 디자인 적용 완료
- [x] 터치 인터랙션 최적화 완료
- [x] 로딩 상태 처리 구현 완료
- [x] 다양한 디바이스에서 테스트 완료

## 🔗 관련 작업
- Task 01: Auth Setup (인증 상태 확인)
- Task 04: Image Upload (버튼 클릭 시 실행되는 기능)
- Task 06: Loading States (버튼 상태 관리)

## 📚 참고 자료
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-typography)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Next.js App Router 가이드](https://nextjs.org/docs/app)
