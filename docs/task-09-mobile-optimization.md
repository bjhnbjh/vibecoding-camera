# Task 09: 모바일 웹 최적화 및 반응형 디자인 적용

## 📋 작업 개요
- **작업명**: 모바일 웹 최적화 및 반응형 디자인 적용
- **우선순위**: 높음 (모바일 우선 서비스)
- **예상 소요시간**: 5-6시간

## 🎯 목표
모바일 기기에서 최적의 사용자 경험을 제공하도록 앱 전체를 최적화하고, 다양한 화면 크기에 대응하는 반응형 디자인을 적용한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **모바일 우선 설계**
   - 터치 친화적 인터페이스
   - 적절한 버튼 크기 (최소 44px)
   - 스와이프 제스처 지원

2. **반응형 레이아웃**
   - 모바일 (320px~767px)
   - 태블릿 (768px~1023px)  
   - 데스크톱 (1024px 이상)

3. **성능 최적화**
   - 빠른 로딩 시간
   - 이미지 최적화
   - 코드 분할 (Code Splitting)

4. **PWA 기능**
   - 홈 화면 추가 가능
   - 오프라인 기본 기능
   - 푸시 알림 (선택사항)

### 비기능적 요구사항
- **성능**: 모바일에서 3초 이내 초기 로딩
- **접근성**: WCAG 2.1 AA 준수
- **호환성**: iOS Safari, Android Chrome 지원

## 🛠 기술 구현 사항

### 1. 반응형 브레이크포인트 설정
```css
/* globals.css */
:root {
  /* 브레이크포인트 */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;

  /* 터치 타겟 크기 */
  --touch-target-min: 44px;
  
  /* 간격 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

/* 기본 모바일 스타일 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  touch-action: manipulation;
}

/* 터치 하이라이트 제거 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 스크롤 최적화 */
* {
  -webkit-overflow-scrolling: touch;
}
```

### 2. 반응형 컨테이너 컴포넌트
```typescript
// components/ResponsiveContainer.tsx
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveContainer({ 
  children, 
  className = '', 
  maxWidth = 'lg' 
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      w-full mx-auto px-4 sm:px-6 lg:px-8
      ${maxWidthClasses[maxWidth]}
      ${className}
    `}>
      {children}
    </div>
  );
}
```

### 3. 터치 최적화 버튼 컴포넌트
```typescript
// components/TouchButton.tsx
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function TouchButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: TouchButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    touch-manipulation
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    ghost: 'hover:bg-gray-100 text-gray-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 4. 모바일 네비게이션
```typescript
// components/MobileNavigation.tsx
export function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '홈', icon: HomeIcon },
    { href: '/dashboard', label: '식단', icon: ChartBarIcon },
    { href: '/profile', label: '프로필', icon: UserIcon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center justify-center
                py-2 px-1 min-h-[60px]
                transition-colors duration-200
                ${isActive 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 5. 이미지 최적화 컴포넌트
```typescript
// components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${error ? 'hidden' : ''}
        `}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <PhotoIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
}
```

### 6. 스와이프 제스처 훅
```typescript
// hooks/useSwipe.ts
interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipe(handlers: SwipeHandlers, threshold: number = 50) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < threshold) return;

    if (absDeltaX > absDeltaY) {
      // 수평 스와이프
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    } else {
      // 수직 스와이프
      if (deltaY > 0) {
        handlers.onSwipeDown?.();
      } else {
        handlers.onSwipeUp?.();
      }
    }

    touchStart.current = null;
  }, [handlers, threshold]);

  return { handleTouchStart, handleTouchEnd };
}
```

## 📱 PWA 설정

### 1. 매니페스트 파일
```json
// public/manifest.json
{
  "name": "AI 식단 관리",
  "short_name": "식단관리",
  "description": "원클릭 AI 식단 기록 서비스",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["health", "lifestyle"],
  "lang": "ko"
}
```

### 2. 서비스 워커 등록
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3. 기본 서비스 워커
```javascript
// public/sw.js
const CACHE_NAME = 'diet-app-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
```

## 🎨 모바일 UI 패턴

### 1. 풀스크린 모달
```typescript
// components/MobileModal.tsx
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileModal({ isOpen, onClose, title, children }: MobileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 2. 하단 시트
```typescript
// components/BottomSheet.tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  height = 'auto' 
}: BottomSheetProps) {
  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-1/2',
    full: 'h-full'
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white rounded-t-3xl
        transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        ${heightClasses[height]}
      `}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        <div className="px-4 pb-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
```

## 📊 성능 최적화

### 1. 이미지 지연 로딩
```typescript
// hooks/useIntersectionObserver.ts
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return isVisible;
}
```

### 2. 코드 분할
```typescript
// 동적 임포트를 통한 코드 분할
const Dashboard = dynamic(() => import('./Dashboard'), {
  loading: () => <DashboardSkeleton />
});

const ImageUploader = dynamic(() => import('./ImageUploader'), {
  loading: () => <div>Loading...</div>
});
```

## ✅ 완료 기준 (Definition of Done)
- [ ] 반응형 브레이크포인트 설정 완료
- [ ] 터치 친화적 UI 컴포넌트 구현 완료
- [ ] 모바일 네비게이션 구현 완료
- [ ] 이미지 최적화 적용 완료
- [ ] PWA 매니페스트 및 서비스 워커 설정 완료
- [ ] 스와이프 제스처 지원 구현 완료
- [ ] 성능 최적화 적용 완료
- [ ] 다양한 기기에서 테스트 완료
- [ ] 접근성 기능 확인 완료

## 🔗 관련 작업
- 모든 Task (전체 UI 최적화)
- Task 03: Main UI (메인 페이지 반응형)
- Task 07: Dashboard (대시보드 모바일 최적화)

## 📚 참고 자료
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [PWA 가이드](https://web.dev/progressive-web-apps/)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/principles)
- [Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
