# Task 06: 로딩 상태 UI 구현 (업로드 진행 상황 표시)

## 📋 작업 개요
- **작업명**: 로딩 상태 UI 구현 (업로드 진행 상황 표시)
- **우선순위**: 중간 (사용자 경험 향상)
- **예상 소요시간**: 3-4시간

## 🎯 목표
사용자가 이미지 업로드 및 AI 분석 과정을 시각적으로 확인할 수 있도록 다양한 로딩 상태와 진행 상황을 표시하는 UI를 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **단계별 로딩 상태 표시**
   - 이미지 압축 중
   - 서버로 업로드 중
   - AI 분석 중
   - 결과 저장 중

2. **진행률 표시**
   - 시각적 진행 바
   - 백분율 표시
   - 현재 단계 텍스트

3. **인터랙티브 요소**
   - 취소 버튼 (가능한 경우)
   - 재시도 버튼 (실패 시)
   - 백그라운드 처리 옵션

4. **피드백 메시지**
   - 각 단계별 설명 텍스트
   - 예상 소요 시간 안내
   - 완료/실패 메시지

### 비기능적 요구사항
- **직관성**: 현재 상태를 명확히 인지할 수 있는 UI
- **반응성**: 부드러운 애니메이션과 즉각적인 피드백
- **접근성**: 시각 장애인을 위한 스크린 리더 지원

## 🎨 UI/UX 디자인

### 로딩 상태별 시각적 표현
```typescript
enum LoadingState {
  IDLE = 'idle',
  COMPRESSING = 'compressing',
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  SAVING = 'saving',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface LoadingStep {
  state: LoadingState;
  title: string;
  description: string;
  estimatedTime: number; // 초 단위
  color: string;
}

const LOADING_STEPS: LoadingStep[] = [
  {
    state: LoadingState.COMPRESSING,
    title: '이미지 최적화 중',
    description: '업로드를 위해 이미지를 압축하고 있습니다',
    estimatedTime: 2,
    color: '#3b82f6'
  },
  {
    state: LoadingState.UPLOADING,
    title: '업로드 중',
    description: '서버로 이미지를 전송하고 있습니다',
    estimatedTime: 5,
    color: '#8b5cf6'
  },
  {
    state: LoadingState.ANALYZING,
    title: 'AI 분석 중',
    description: '음식을 인식하고 영양정보를 분석하고 있습니다',
    estimatedTime: 15,
    color: '#10b981'
  },
  {
    state: LoadingState.SAVING,
    title: '결과 저장 중',
    description: '분석 결과를 데이터베이스에 저장하고 있습니다',
    estimatedTime: 3,
    color: '#f59e0b'
  }
];
```

### 컴포넌트 구조
```typescript
// components/LoadingOverlay.tsx
interface LoadingOverlayProps {
  isVisible: boolean;
  currentState: LoadingState;
  progress: number;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: string;
}

export function LoadingOverlay({
  isVisible,
  currentState,
  progress,
  onCancel,
  onRetry,
  error
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        {currentState === LoadingState.ERROR ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : currentState === LoadingState.SUCCESS ? (
          <SuccessState />
        ) : (
          <LoadingState 
            currentState={currentState}
            progress={progress}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  );
}
```

## 🛠 기술 구현 사항

### 1. 진행률 계산 로직
```typescript
// hooks/useUploadProgress.ts
export function useUploadProgress() {
  const [state, setState] = useState<LoadingState>(LoadingState.IDLE);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const updateProgress = useCallback((newState: LoadingState, customProgress?: number) => {
    setState(newState);
    
    if (customProgress !== undefined) {
      setProgress(customProgress);
      return;
    }

    // 단계별 진행률 자동 계산
    const stepIndex = LOADING_STEPS.findIndex(step => step.state === newState);
    if (stepIndex >= 0) {
      const baseProgress = (stepIndex / LOADING_STEPS.length) * 100;
      setProgress(baseProgress);
    }
  }, []);

  const simulateProgress = useCallback((targetProgress: number, duration: number) => {
    const startProgress = progress;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const currentProgress = startProgress + (targetProgress - startProgress) * progressRatio;
      
      setProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [progress]);

  return {
    state,
    progress,
    updateProgress,
    simulateProgress,
    reset: () => {
      setState(LoadingState.IDLE);
      setProgress(0);
      setStartTime(null);
    }
  };
}
```

### 2. 애니메이션 컴포넌트
```typescript
// components/ProgressBar.tsx
interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({ 
  progress, 
  color = '#10b981', 
  height = 4,
  animated = true 
}: ProgressBarProps) {
  return (
    <div 
      className="progress-bar-container"
      style={{ height: `${height}px` }}
    >
      <div
        className={`progress-bar-fill ${animated ? 'animated' : ''}`}
        style={{
          width: `${Math.min(Math.max(progress, 0), 100)}%`,
          backgroundColor: color,
          transition: animated ? 'width 0.3s ease-out' : 'none'
        }}
      />
    </div>
  );
}
```

### 3. 단계별 표시 컴포넌트
```typescript
// components/LoadingSteps.tsx
interface LoadingStepsProps {
  currentState: LoadingState;
  progress: number;
}

export function LoadingSteps({ currentState, progress }: LoadingStepsProps) {
  const currentStepIndex = LOADING_STEPS.findIndex(step => step.state === currentState);
  
  return (
    <div className="loading-steps">
      {LOADING_STEPS.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <div 
            key={step.state}
            className={`loading-step ${
              isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'
            }`}
          >
            <div className="step-indicator">
              {isCompleted ? (
                <CheckIcon className="step-icon" />
              ) : isActive ? (
                <LoadingSpinner className="step-icon" color={step.color} />
              ) : (
                <div className="step-number">{index + 1}</div>
              )}
            </div>
            
            <div className="step-content">
              <h4 className="step-title">{step.title}</h4>
              <p className="step-description">{step.description}</p>
              {isActive && (
                <div className="step-progress">
                  <ProgressBar 
                    progress={progress} 
                    color={step.color}
                    height={2}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## 📱 모바일 최적화

### 터치 친화적 인터랙션
```css
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin: 16px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.cancel-button {
  min-height: 44px;
  min-width: 44px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 16px;
  touch-action: manipulation;
}

.retry-button {
  min-height: 44px;
  border-radius: 8px;
  background: #10b981;
  color: white;
  font-size: 16px;
  font-weight: 600;
  touch-action: manipulation;
}
```

### 접근성 고려사항
```typescript
// components/LoadingAnnouncer.tsx
export function LoadingAnnouncer({ currentState, progress }: LoadingAnnouncerProps) {
  const currentStep = LOADING_STEPS.find(step => step.state === currentState);
  
  return (
    <div 
      role="status" 
      aria-live="polite"
      aria-label={`${currentStep?.title} ${Math.round(progress)}% 완료`}
      className="sr-only"
    >
      {currentStep?.description}
    </div>
  );
}
```

## 🎭 상태별 UI 변화

### 성공 상태
```typescript
function SuccessState() {
  return (
    <div className="success-state">
      <CheckCircleIcon className="success-icon" />
      <h3>분석 완료!</h3>
      <p>식단이 성공적으로 기록되었습니다.</p>
      <button className="view-result-button">
        결과 확인하기
      </button>
    </div>
  );
}
```

### 에러 상태
```typescript
function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <XCircleIcon className="error-icon" />
      <h3>오류가 발생했습니다</h3>
      <p className="error-message">{error}</p>
      <div className="error-actions">
        <button onClick={onRetry} className="retry-button">
          다시 시도
        </button>
        <button className="cancel-button">
          취소
        </button>
      </div>
    </div>
  );
}
```

## ✅ 완료 기준 (Definition of Done)
- [ ] 로딩 오버레이 컴포넌트 구현 완료
- [ ] 단계별 진행 상태 표시 구현 완료
- [ ] 진행률 바 애니메이션 구현 완료
- [ ] 성공/실패 상태 UI 구현 완료
- [ ] 취소/재시도 기능 구현 완료
- [ ] 모바일 최적화 완료
- [ ] 접근성 기능 구현 완료
- [ ] 다양한 네트워크 상황에서 테스트 완료

## 🔗 관련 작업
- Task 04: Image Upload (로딩 상태 트리거)
- Task 05: n8n Webhook (진행 상황 업데이트)
- Task 08: Error Handling (에러 상태 표시)

## 📚 참고 자료
- [React Transition Group](https://reactcommunity.org/react-transition-group/)
- [Framer Motion](https://www.framer.com/motion/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
