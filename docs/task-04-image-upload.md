# Task 04: 이미지 선택 및 업로드 기능 구현 (Server Actions 활용)

## 📋 작업 개요
- **작업명**: 이미지 선택 및 업로드 기능 구현 (Server Actions + 카메라/갤러리)
- **우선순위**: 높음 (핵심 기능)
- **예상 소요시간**: 5-6시간
- **기술 스택**: Next.js 15 Server Actions, FormData API, Supabase Storage

## 🎯 목표
Next.js 15의 Server Actions를 활용하여 사용자가 모바일 기기의 카메라로 직접 촬영하거나 갤러리에서 기존 사진을 선택하여 서버에서 안전하게 처리하고 즉시 업로드할 수 있는 기능을 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **이미지 선택 옵션**
   - 카메라로 직접 촬영
   - 갤러리에서 기존 사진 선택
   - 브라우저 파일 선택 (데스크톱 대응)

2. **이미지 처리**
   - 지원 형식: JPEG, PNG, WebP
   - 최대 파일 크기: 10MB
   - 자동 이미지 압축 (필요시)
   - 이미지 미리보기 표시

3. **업로드 프로세스**
   - 선택 즉시 업로드 시작
   - 업로드 진행률 표시
   - 네트워크 오류 시 재시도 기능

4. **사용자 경험**
   - 직관적인 선택 인터페이스
   - 명확한 피드백 메시지
   - 취소 기능 제공

### 비기능적 요구사항
- **성능**: 빠른 이미지 처리 및 업로드
- **호환성**: 주요 모바일 브라우저 지원
- **보안**: 안전한 파일 업로드 처리

## 🛠 기술 구현 사항

### 1. Server Action 기반 이미지 업로더 컴포넌트
```typescript
// components/ImageUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { uploadFoodImage } from '@/app/actions/upload'
import { compressImage } from '@/lib/utils/imageCompression'

interface ImageUploaderProps {
  onUploadStart?: () => void
  onUploadComplete?: (result: any) => void
  onUploadError?: (error: string) => void
}

export function ImageUploader({ 
  onUploadStart, 
  onUploadComplete, 
  onUploadError 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)
      onUploadStart?.()

      // 1. 이미지 압축 (선택적)
      setUploadProgress(20)
      const compressedFile = await compressImage(file, 1024)
      
      // 2. FormData 생성
      setUploadProgress(40)
      const formData = new FormData()
      formData.append('image', compressedFile)

      // 3. Server Action 호출
      setUploadProgress(60)
      const result = await uploadFoodImage(formData)
      
      setUploadProgress(100)

      if (result.success) {
        onUploadComplete?.(result.data)
      } else {
        onUploadError?.(result.error || '업로드에 실패했습니다.')
      }

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment" // 모바일에서 후면 카메라 우선
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />
      
      <button
        onClick={triggerFileSelect}
        disabled={isUploading}
        className={`
          w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center
          text-white font-bold text-xl shadow-2xl transform transition-all duration-300
          ${isUploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 hover:scale-105 active:scale-95'
          }
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">업로드 중... {uploadProgress}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <span className="text-4xl">📸</span>
            <span className="text-lg">식단 기록하기</span>
            <span className="text-sm opacity-90">탭하여 시작</span>
          </div>
        )}
      </button>
    </div>
  )
}
```

### 2. 진보된 이미지 업로더 (useActionState 활용)
```typescript
// components/AdvancedImageUploader.tsx
'use client'

import { useActionState } from 'react'
import { uploadFoodImage } from '@/app/actions/upload'

const initialState = {
  success: false,
  data: null,
  error: null
}

export function AdvancedImageUploader() {
  const [state, formAction, isPending] = useActionState(
    uploadFoodImage,
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="upload-area">
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required
          disabled={isPending}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`
          w-full py-3 px-4 rounded-lg font-medium text-white transition-colors
          ${isPending 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-700'
          }
        `}
      >
        {isPending ? '분석 중...' : '식단 기록하기'}
      </button>

      {/* 결과 표시 */}
      {state.success && state.data && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            분석 완료!
          </h3>
          <p className="text-green-700">
            총 {state.data.summary.totalCalories}kcal의 식단이 기록되었습니다.
          </p>
          <div className="mt-2 space-y-1">
            {state.data.items.map((item: any, index: number) => (
              <div key={index} className="text-sm text-green-600">
                • {item.foodName} ({item.calories}kcal)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {!state.success && state.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{state.error}</p>
        </div>
      )}
    </form>
  )
}
```

### 2. 이미지 선택 방법
```html
<!-- 카메라 + 갤러리 + 파일 선택 모두 지원 -->
<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  capture="environment" // 후면 카메라 우선
  onChange={handleFileSelect}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
```

### 3. 이미지 압축 함수
```typescript
// utils/imageCompression.ts
export async function compressImage(file: File, maxSize: number = 1024): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 압축 로직 구현
      const { width, height } = calculateDimensions(img.width, img.height, maxSize);
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob!], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, file.type, 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
}
```

### 4. Server Action 기반 업로드 함수
```typescript
// app/actions/upload.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/utils'

interface UploadResult {
  success: boolean
  data?: {
    items: FoodItem[]
    summary: NutrientSummary
    imageUrl: string
  }
  error?: string
}

export async function uploadFoodImage(formData: FormData): Promise<UploadResult> {
  try {
    // 1. 사용자 인증 확인
    const user = await requireAuth()
    
    // 2. 폼 데이터에서 이미지 추출
    const image = formData.get('image') as File
    
    if (!image || image.size === 0) {
      return {
        success: false,
        error: '이미지를 선택해주세요.'
      }
    }

    // 3. 파일 검증
    const validationResult = validateImageFile(image)
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error
      }
    }

    // 4. Supabase Storage에 이미지 업로드
    const supabase = createClient()
    const fileName = `${user.id}/${Date.now()}-${image.name}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(fileName, image, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return {
        success: false,
        error: '이미지 업로드에 실패했습니다.'
      }
    }

    // 5. 업로드된 이미지의 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(fileName)

    // 6. n8n 웹훅으로 분석 요청
    const analysisResult = await sendToN8nWebhook(image, user.id)
    
    if (!analysisResult.success) {
      // 실패 시 업로드된 이미지 삭제
      await supabase.storage
        .from('food-images')
        .remove([fileName])
      
      return {
        success: false,
        error: analysisResult.error?.message || '음식 분석에 실패했습니다.'
      }
    }

    // 7. 분석 결과를 데이터베이스에 저장
    const { error: dbError } = await supabase
      .from('food_logs')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        analysis_result: analysisResult.data,
        total_calories: analysisResult.data?.summary.totalCalories || 0,
        total_carbohydrates: analysisResult.data?.summary.totalCarbohydrates.value || 0,
        total_protein: analysisResult.data?.summary.totalProtein.value || 0,
        total_fat: analysisResult.data?.summary.totalFat.value || 0,
        meal_type: determineMealType(), // 시간 기반 자동 판별
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      return {
        success: false,
        error: '기록 저장에 실패했습니다.'
      }
    }

    // 8. 캐시 재검증 및 성공 응답
    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return {
      success: true,
      data: {
        ...analysisResult.data!,
        imageUrl: publicUrl
      }
    }

  } catch (error) {
    console.error('Upload action error:', error)
    return {
      success: false,
      error: '예상치 못한 오류가 발생했습니다.'
    }
  }
}

// 파일 검증 함수
function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // 파일 크기 검증 (10MB)
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: '파일 크기는 10MB 이하여야 합니다.'
    }
  }

  // MIME 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'JPEG, PNG, WebP 파일만 업로드할 수 있습니다.'
    }
  }

  return { isValid: true }
}

// 시간 기반 끼니 자동 판별
function determineMealType(): string {
  const hour = new Date().getHours()
  
  if (hour >= 4 && hour < 11) return '아침'
  if (hour >= 11 && hour < 17) return '점심'  
  if (hour >= 17 && hour < 22) return '저녁'
  return '간식'
}
```

## 📱 모바일 최적화

### 1. 카메라 접근 권한 처리
```typescript
async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop()); // 즉시 종료
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}
```

### 2. 터치 친화적 UI
```css
.upload-button {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.image-preview {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### 3. 진행률 표시
```typescript
interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export function UploadProgress({ progress, status }: UploadProgressProps) {
  return (
    <div className="upload-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="progress-text">
        {getStatusMessage(status, progress)}
      </p>
    </div>
  );
}
```

## 🔄 상태 관리

### 업로드 상태 정의
```typescript
interface UploadState {
  status: 'idle' | 'selecting' | 'compressing' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  selectedFile: File | null;
  previewUrl: string | null;
  error: string | null;
  result: any | null;
}
```

### 상태 전환 플로우
```
idle → selecting → compressing → uploading → processing → success
  ↓                    ↓           ↓           ↓
error ← ─ ─ ─ ─ ─ ─ ─ ─ ┴ ─ ─ ─ ─ ─ ┴ ─ ─ ─ ─ ─ ┘
```

## 🚨 에러 처리

### 주요 에러 시나리오
1. **파일 크기 초과**
   ```typescript
   if (file.size > MAX_FILE_SIZE) {
     throw new Error('파일 크기가 10MB를 초과합니다.');
   }
   ```

2. **지원하지 않는 파일 형식**
   ```typescript
   const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
   if (!allowedTypes.includes(file.type)) {
     throw new Error('JPEG, PNG, WebP 파일만 업로드할 수 있습니다.');
   }
   ```

3. **네트워크 오류**
   ```typescript
   const retryUpload = async (file: File, retries: number = 3): Promise<any> => {
     for (let i = 0; i < retries; i++) {
       try {
         return await uploadToN8n(file, userId);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   };
   ```

## ✅ 완료 기준 (Definition of Done)
- [x] Server Actions 기반 이미지 업로드 시스템 설계 완료
- [x] useActionState 훅 활용 컴포넌트 설계 완료
- [x] 파일 검증 및 압축 로직 설계 완료
- [ ] 카메라 촬영 기능 구현 완료
- [ ] 갤러리 선택 기능 구현 완료
- [ ] 이미지 압축 기능 구현 완료
- [ ] n8n 웹훅으로 업로드 기능 구현 완료
- [ ] 업로드 진행률 표시 구현 완료
- [ ] 에러 처리 및 재시도 기능 구현 완료
- [ ] 모바일 브라우저에서 테스트 완료
- [ ] 다양한 이미지 형식 테스트 완료
- [ ] 네트워크 불안정 상황 테스트 완료

## 🔗 관련 작업
- Task 03: Main UI (버튼 클릭 시 실행)
- Task 05: n8n Webhook (업로드 대상 API)
- Task 06: Loading States (업로드 상태 표시)
- Task 08: Error Handling (업로드 에러 처리)

## 📚 참고 자료
- [File API 공식 문서](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
