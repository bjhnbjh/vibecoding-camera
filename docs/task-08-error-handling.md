# Task 08: 에러 처리 및 사용자 피드백 시스템 구현

## 📋 작업 개요
- **작업명**: 에러 처리 및 사용자 피드백 시스템 구현
- **우선순위**: 중간 (사용자 경험 향상)
- **예상 소요시간**: 4-5시간

## 🎯 목표
앱 전반에서 발생할 수 있는 다양한 에러 상황을 적절히 처리하고, 사용자에게 명확하고 도움이 되는 피드백을 제공하는 시스템을 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **에러 분류 및 처리**
   - 네트워크 에러 (연결 실패, 타임아웃)
   - 인증 에러 (로그인 만료, 권한 없음)
   - 파일 업로드 에러 (크기 초과, 형식 불일치)
   - AI 분석 에러 (음식 인식 실패)
   - 서버 에러 (500, 503 등)

2. **사용자 피드백**
   - 에러 상황별 맞춤 메시지
   - 해결 방법 제시
   - 재시도 옵션 제공
   - 고객 지원 연결

3. **에러 로깅 및 모니터링**
   - 클라이언트 에러 로그 수집
   - 에러 발생 빈도 추적
   - 사용자 행동 패턴 분석

### 비기능적 요구사항
- **사용자 친화성**: 기술적 용어 대신 이해하기 쉬운 언어 사용
- **일관성**: 전체 앱에서 통일된 에러 처리 방식
- **복구 가능성**: 가능한 경우 자동 복구 시도

## 🛠 기술 구현 사항

### 1. 에러 타입 정의
```typescript
// types/errors.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  AI_ANALYSIS_ERROR = 'AI_ANALYSIS_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  action?: string;
}

export class CustomError extends Error {
  public type: ErrorType;
  public code: string;
  public details?: any;
  public timestamp: Date;

  constructor(type: ErrorType, code: string, message: string, details?: any) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.name = 'CustomError';
  }
}
```

### 2. 에러 처리 유틸리티
```typescript
// utils/errorHandler.ts
export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof CustomError) {
      return {
        type: error.type,
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp
      };
    }

    if (error instanceof Error) {
      // 네트워크 에러 감지
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          type: ErrorType.NETWORK_ERROR,
          code: 'NETWORK_FAILED',
          message: '인터넷 연결을 확인해주세요.',
          timestamp: new Date()
        };
      }

      // 인증 에러 감지
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return {
          type: ErrorType.AUTH_ERROR,
          code: 'AUTH_FAILED',
          message: '로그인이 필요합니다.',
          timestamp: new Date()
        };
      }
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      code: 'UNKNOWN',
      message: '알 수 없는 오류가 발생했습니다.',
      timestamp: new Date()
    };
  }

  static getRecoveryAction(error: AppError): RecoveryAction | null {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return {
          type: 'retry',
          label: '다시 시도',
          description: '네트워크 연결을 확인하고 다시 시도해주세요.'
        };

      case ErrorType.AUTH_ERROR:
        return {
          type: 'redirect',
          label: '로그인하기',
          description: '로그인 페이지로 이동합니다.',
          url: '/auth/login'
        };

      case ErrorType.FILE_ERROR:
        return {
          type: 'retry',
          label: '다른 사진 선택',
          description: '다른 사진을 선택하거나 사진을 다시 촬영해주세요.'
        };

      default:
        return null;
    }
  }
}

interface RecoveryAction {
  type: 'retry' | 'redirect' | 'contact';
  label: string;
  description: string;
  url?: string;
  action?: () => void;
}
```

### 3. 글로벌 에러 컨텍스트
```typescript
// contexts/ErrorContext.tsx
interface ErrorContextType {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const ErrorContext = createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<(AppError & { id: string })[]>([]);

  const addError = useCallback((error: AppError) => {
    const errorWithId = { ...error, id: crypto.randomUUID() };
    setErrors(prev => [...prev, errorWithId]);

    // 자동 제거 (일정 시간 후)
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== errorWithId.id));
    }, 5000);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
      <ErrorDisplay />
    </ErrorContext.Provider>
  );
}

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};
```

### 4. 에러 표시 컴포넌트
```typescript
// components/ErrorDisplay.tsx
export function ErrorDisplay() {
  const { errors, removeError } = useError();

  return (
    <div className="error-container">
      {errors.map(error => (
        <ErrorToast 
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  );
}

interface ErrorToastProps {
  error: AppError & { id: string };
  onDismiss: () => void;
}

export function ErrorToast({ error, onDismiss }: ErrorToastProps) {
  const recoveryAction = ErrorHandler.getRecoveryAction(error);

  return (
    <div className={`error-toast ${error.type.toLowerCase()}`}>
      <div className="error-content">
        <div className="error-icon">
          {getErrorIcon(error.type)}
        </div>
        
        <div className="error-text">
          <h4 className="error-title">
            {getErrorTitle(error.type)}
          </h4>
          <p className="error-message">
            {error.message}
          </p>
        </div>
        
        <button 
          onClick={onDismiss}
          className="error-dismiss"
          aria-label="알림 닫기"
        >
          <XIcon />
        </button>
      </div>

      {recoveryAction && (
        <div className="error-actions">
          <button 
            onClick={() => handleRecoveryAction(recoveryAction)}
            className="recovery-button"
          >
            {recoveryAction.label}
          </button>
          <p className="recovery-description">
            {recoveryAction.description}
          </p>
        </div>
      )}
    </div>
  );
}
```

### 5. API 에러 처리 래퍼
```typescript
// utils/apiWrapper.ts
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    
    // 컨텍스트 정보 추가
    if (context) {
      appError.action = context;
    }

    // 로깅
    logError(appError);
    
    // 에러 컨텍스트에 추가
    const { addError } = useError();
    addError(appError);
    
    throw appError;
  }
}

// 사용 예시
export async function uploadImage(file: File) {
  return withErrorHandling(
    async () => {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: createFormData(file)
      });
      
      if (!response.ok) {
        throw new CustomError(
          ErrorType.SERVER_ERROR,
          `HTTP_${response.status}`,
          '서버에서 오류가 발생했습니다.'
        );
      }
      
      return response.json();
    },
    'image_upload'
  );
}
```

### 6. 특정 에러 처리 훅
```typescript
// hooks/useFileUploadError.ts
export function useFileUploadError() {
  const { addError } = useError();

  const handleFileError = useCallback((file: File, error: unknown) => {
    if (file.size > 10 * 1024 * 1024) {
      addError({
        type: ErrorType.FILE_ERROR,
        code: 'FILE_TOO_LARGE',
        message: '파일 크기가 10MB를 초과합니다. 더 작은 파일을 선택해주세요.',
        timestamp: new Date()
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addError({
        type: ErrorType.FILE_ERROR,
        code: 'INVALID_FILE_TYPE',
        message: 'JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.',
        timestamp: new Date()
      });
      return;
    }

    // 기타 에러
    const appError = ErrorHandler.handle(error);
    addError(appError);
  }, [addError]);

  return { handleFileError };
}
```

## 📊 에러 로깅 및 모니터링

### 클라이언트 에러 로깅
```typescript
// utils/errorLogger.ts
interface ErrorLog {
  error: AppError;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
}

export function logError(error: AppError) {
  const errorLog: ErrorLog = {
    error,
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId()
  };

  // 로컬 스토리지에 임시 저장
  const logs = getStoredLogs();
  logs.push(errorLog);
  localStorage.setItem('error_logs', JSON.stringify(logs));

  // 서버로 전송 (배치 처리)
  sendErrorLogsToServer();
}

async function sendErrorLogsToServer() {
  const logs = getStoredLogs();
  if (logs.length === 0) return;

  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs })
    });

    // 전송 성공 시 로컬 로그 삭제
    localStorage.removeItem('error_logs');
  } catch (error) {
    console.warn('Failed to send error logs:', error);
  }
}
```

### 에러 모니터링 대시보드 (관리자용)
```typescript
// app/admin/errors/page.tsx (관리자 전용)
export default function ErrorMonitoringPage() {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);

  return (
    <div className="error-monitoring">
      <h1>에러 모니터링</h1>
      
      <div className="error-stats">
        <StatCard 
          title="총 에러 수"
          value={errorStats?.totalErrors}
          trend={errorStats?.errorTrend}
        />
        <StatCard 
          title="가장 빈번한 에러"
          value={errorStats?.mostCommonError}
        />
      </div>

      <ErrorChart data={errorStats?.errorsByType} />
      <RecentErrorsList errors={errorStats?.recentErrors} />
    </div>
  );
}
```

## 🎨 에러 UI 스타일링

### 에러 타입별 색상 및 아이콘
```css
.error-toast {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.error-toast.network_error {
  border-left: 4px solid #ef4444;
}

.error-toast.auth_error {
  border-left: 4px solid #f59e0b;
}

.error-toast.file_error {
  border-left: 4px solid #8b5cf6;
}

.error-toast.ai_analysis_error {
  border-left: 4px solid #06b6d4;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## ✅ 완료 기준 (Definition of Done)
- [ ] 에러 타입 정의 및 분류 시스템 구현 완료
- [ ] 글로벌 에러 처리 컨텍스트 구현 완료
- [ ] 에러 표시 UI 컴포넌트 구현 완료
- [ ] API 에러 처리 래퍼 구현 완료
- [ ] 파일 업로드 에러 처리 구현 완료
- [ ] 에러 로깅 시스템 구현 완료
- [ ] 복구 액션 시스템 구현 완료
- [ ] 다양한 에러 시나리오 테스트 완료

## 🔗 관련 작업
- Task 04: Image Upload (파일 에러 처리)
- Task 05: n8n Webhook (API 에러 처리)
- Task 07: Dashboard (데이터 로딩 에러)

## 📚 참고 자료
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [MDN Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [Web Accessibility Error Messages](https://webaim.org/techniques/formvalidation/)
- [Sentry Error Monitoring](https://sentry.io/welcome/) (참고용)
