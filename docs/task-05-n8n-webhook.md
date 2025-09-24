# Task 05: n8n 웹훅 연동 구현 (Server Actions 활용)

## 📋 작업 개요
- **작업명**: n8n 웹훅 연동 구현 (Server Actions + multipart/form-data 전송)
- **우선순위**: 높음 (핵심 백엔드 연동)
- **예상 소요시간**: 4-5시간
- **기술 스택**: Next.js 15 Server Actions, n8n Webhook, Supabase

## 🎯 목표
Next.js 15의 Server Actions를 활용하여 서버에서 안전하게 이미지 파일과 사용자 정보를 n8n 웹훅으로 전송하고, AI 분석 결과를 받아 Supabase에 저장하는 통합 워크플로우를 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **n8n 웹훅 요청**
   - `multipart/form-data` 형식으로 데이터 전송
   - 이미지 파일 + 사용자 ID 포함
   - 끼니 정보는 전송하지 않음 (n8n에서 시간 기반 자동 판별)

2. **응답 처리**
   - 성공/실패 상태 확인
   - AI 분석 결과 파싱
   - 에러 메시지 처리

3. **데이터베이스 연동**
   - n8n 응답을 Supabase에 저장 (백업/로그 목적)
   - 실패한 요청에 대한 재시도 로직

### 비기능적 요구사항
- **신뢰성**: 네트워크 오류 시 재시도 메커니즘
- **보안**: 사용자 인증 확인 및 데이터 검증
- **성능**: 타임아웃 설정 및 효율적인 에러 처리

## 🛠 기술 구현 사항

### 1. Server Action 기반 n8n 웹훅 연동
```typescript
// lib/n8n/webhook.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/utils'

interface N8nWebhookResponse {
  success: boolean
  data?: {
    items: FoodItem[]
    summary: NutrientSummary
  }
  error?: {
    code: string
    message: string
  }
}

interface FoodItem {
  foodName: string
  confidence: number
  quantity: string
  calories: number
  nutrients: {
    carbohydrates: { value: number; unit: string }
    protein: { value: number; unit: string }
    fat: { value: number; unit: string }
    sugars: { value: number; unit: string }
    sodium: { value: number; unit: string }
  }
}

interface NutrientSummary {
  totalCalories: number
  totalCarbohydrates: { value: number; unit: string }
  totalProtein: { value: number; unit: string }
  totalFat: { value: number; unit: string }
}

export async function sendToN8nWebhook(
  image: File, 
  userId: string
): Promise<N8nWebhookResponse> {
  try {
    // 1. 사용자 인증 확인 (추가 보안 계층)
    const user = await requireAuth()
    
    if (user.id !== userId) {
      throw new Error('User ID mismatch')
    }

    // 2. FormData 준비
    const formData = new FormData()
    formData.append('image', image)
    formData.append('userId', userId)
    
    // 현재 시간 정보도 전송 (n8n에서 끼니 판별용)
    formData.append('timestamp', new Date().toISOString())

    // 3. 타임아웃 설정을 위한 AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45초 타임아웃

    try {
      // 4. n8n 웹훅 호출
      const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // FormData 사용 시 Content-Type은 자동 설정
          'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
          'User-Agent': 'NextJS-FoodApp/1.0'
        },
      })

      clearTimeout(timeoutId)

      // 5. 응답 상태 확인
      if (!response.ok) {
        const errorText = await response.text()
        console.error('n8n webhook error:', response.status, errorText)
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 6. 응답 데이터 파싱 및 검증
      const result = await response.json()
      const validatedResult = validateN8nResponse(result)
      
      // 7. 성공한 경우 결과를 데이터베이스에 백업 저장
      await logWebhookResult(userId, image.name, validatedResult, 'success')
      
      return validatedResult

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // 8. 에러 로깅
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      await logWebhookResult(userId, image.name, null, 'error', errorMessage)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('분석 시간이 초과되었습니다. 다시 시도해주세요.')
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('n8n webhook integration error:', error)
    
    return {
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: error instanceof Error ? error.message : '웹훅 연동 중 오류가 발생했습니다.'
      }
    }
  }
}

// n8n 응답 검증 함수
function validateN8nResponse(data: unknown): N8nWebhookResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format')
  }

  const response = data as any

  if (!response.success) {
    return {
      success: false,
      error: {
        code: response.error?.code || 'UNKNOWN_ERROR',
        message: response.error?.message || '알 수 없는 오류가 발생했습니다.'
      }
    }
  }

  // 성공 응답 검증
  if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
    throw new Error('Missing or invalid items in response')
  }

  if (!response.data.summary || typeof response.data.summary.totalCalories !== 'number') {
    throw new Error('Missing or invalid summary in response')
  }

  return response as N8nWebhookResponse
}

// 웹훅 결과 로깅 함수
async function logWebhookResult(
  userId: string,
  imageName: string,
  result: N8nWebhookResponse | null,
  status: 'success' | 'error',
  errorMessage?: string
) {
  try {
    const supabase = createClient()
    
    await supabase.from('webhook_logs').insert({
      user_id: userId,
      image_name: imageName,
      webhook_response: result,
      status,
      error_message: errorMessage,
      created_at: new Date().toISOString()
    })
  } catch (logError) {
    // 로깅 실패는 조용히 처리 (메인 플로우에 영향 없음)
    console.error('Failed to log webhook result:', logError)
  }
}
```

### 2. 재시도 로직이 포함된 웹훅 호출 함수
```typescript
// lib/n8n/webhook-with-retry.ts
'use server'

export async function sendToN8nWebhookWithRetry(
  image: File,
  userId: string,
  maxRetries: number = 3
): Promise<N8nWebhookResponse> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`n8n webhook attempt ${attempt}/${maxRetries}`)
      
      const result = await sendToN8nWebhook(image, userId)
      
      // 성공한 경우 즉시 반환
      if (result.success) {
        return result
      }
      
      // n8n에서 실패 응답을 보낸 경우 (재시도하지 않음)
      if (result.error?.code === 'NO_FOOD_DETECTED' || 
          result.error?.code === 'INVALID_IMAGE') {
        return result
      }
      
      // 다른 에러의 경우 재시도
      lastError = new Error(result.error?.message || 'Unknown webhook error')
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 지수 백오프 (최대 10초)
        console.log(`Retrying in ${delayMs}ms...`)
        
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
    }
  }
  
  // 모든 재시도 실패
  return {
    success: false,
    error: {
      code: 'WEBHOOK_RETRY_FAILED',
      message: `${maxRetries}회 시도 후 실패: ${lastError?.message || '알 수 없는 오류'}`
    }
  }
}
```

### 3. 통합된 식단 기록 Server Action
```typescript
// app/actions/food-record.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/utils'
import { sendToN8nWebhookWithRetry } from '@/lib/n8n/webhook-with-retry'

export async function recordFoodWithAnalysis(formData: FormData) {
  try {
    // 1. 사용자 인증
    const user = await requireAuth()
    
    // 2. 이미지 파일 추출 및 검증
    const image = formData.get('image') as File
    if (!image || image.size === 0) {
      return { success: false, error: '이미지를 선택해주세요.' }
    }
    
    const validation = validateImageFile(image)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // 3. Supabase 클라이언트 초기화
    const supabase = createClient()

    // 4. 이미지를 Supabase Storage에 업로드
    const fileName = `${user.id}/${Date.now()}-${image.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(fileName, image, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: '이미지 업로드에 실패했습니다.' }
    }

    // 5. 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(fileName)

    // 6. n8n 웹훅으로 AI 분석 요청 (재시도 포함)
    const analysisResult = await sendToN8nWebhookWithRetry(image, user.id)
    
    if (!analysisResult.success) {
      // 분석 실패 시 업로드된 이미지 삭제
      await supabase.storage.from('food-images').remove([fileName])
      
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
        meal_type: determineMealType(),
        confidence_score: calculateAverageConfidence(analysisResult.data?.items || []),
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      return { success: false, error: '기록 저장에 실패했습니다.' }
    }

    // 8. 캐시 재검증
    revalidatePath('/')
    revalidatePath('/dashboard')
    
    return {
      success: true,
      data: {
        ...analysisResult.data!,
        imageUrl: publicUrl,
        mealType: determineMealType()
      }
    }

  } catch (error) {
    console.error('Food record action error:', error)
    return {
      success: false,
      error: '예상치 못한 오류가 발생했습니다.'
    }
  }
}

// 평균 신뢰도 계산
function calculateAverageConfidence(items: FoodItem[]): number {
  if (items.length === 0) return 0
  
  const totalConfidence = items.reduce((sum, item) => sum + item.confidence, 0)
  return totalConfidence / items.length
}

// 파일 검증
function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE) {
    return { isValid: false, error: '파일 크기는 10MB 이하여야 합니다.' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'JPEG, PNG, WebP 파일만 업로드할 수 있습니다.' }
  }

  return { isValid: true }
}

// 시간 기반 끼니 판별
function determineMealType(): string {
  const hour = new Date().getHours()
  
  if (hour >= 4 && hour < 11) return '아침'
  if (hour >= 11 && hour < 17) return '점심'
  if (hour >= 17 && hour < 22) return '저녁'
  return '간식'
}
```

### 3. 재시도 로직
```typescript
// lib/retryLogic.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, delayMs * attempt)
        );
        continue;
      }
    }
  }

  throw lastError!;
}

// 사용 예시
const result = await withRetry(
  () => sendToN8nWebhook(image, userId),
  3,
  1000
);
```

### 4. 응답 데이터 검증
```typescript
// lib/validators.ts
import { z } from 'zod';

const FoodItemSchema = z.object({
  foodName: z.string(),
  confidence: z.number().min(0).max(1),
  quantity: z.string(),
  calories: z.number().min(0),
  nutrients: z.object({
    carbohydrates: z.object({ value: z.number(), unit: z.string() }),
    protein: z.object({ value: z.number(), unit: z.string() }),
    fat: z.object({ value: z.number(), unit: z.string() }),
    sugars: z.object({ value: z.number(), unit: z.string() }),
    sodium: z.object({ value: z.number(), unit: z.string() }),
  }),
});

const N8nSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(FoodItemSchema),
    summary: z.object({
      totalCalories: z.number(),
      totalCarbohydrates: z.object({ value: z.number(), unit: z.string() }),
      totalProtein: z.object({ value: z.number(), unit: z.string() }),
      totalFat: z.object({ value: z.number(), unit: z.string() }),
    }),
  }),
});

export function validateN8nResponse(data: unknown): N8nWebhookResponse {
  try {
    return N8nSuccessResponseSchema.parse(data);
  } catch (error) {
    throw new Error('Invalid response format from n8n webhook');
  }
}
```

## 📊 n8n 워크플로우 연동 명세

### 요청 데이터 형식
```typescript
// FormData 구조
interface N8nWebhookRequest {
  image: File;      // 이미지 바이너리 파일
  userId: string;   // Supabase 사용자 ID
}
```

### 응답 데이터 형식
```typescript
// 성공 응답
interface N8nSuccessResponse {
  success: true;
  data: {
    items: Array<{
      foodName: string;
      confidence: number;
      quantity: string;
      calories: number;
      nutrients: {
        carbohydrates: { value: number; unit: string };
        protein: { value: number; unit: string };
        fat: { value: number; unit: string };
        sugars: { value: number; unit: string };
        sodium: { value: number; unit: string };
      };
    }>;
    summary: {
      totalCalories: number;
      totalCarbohydrates: { value: number; unit: string };
      totalProtein: { value: number; unit: string };
      totalFat: { value: number; unit: string };
    };
  };
}

// 실패 응답
interface N8nErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

## 🔐 보안 고려사항

### 1. 사용자 인증 확인
```typescript
async function verifyAuth(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }
  
  return user;
}
```

### 2. 파일 검증
```typescript
function validateImageFile(file: File): void {
  // 파일 크기 검증
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('File size too large');
  }

  // MIME 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // 파일 이름 검증 (보안상 위험한 문자 제거)
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  if (safeName !== file.name) {
    console.warn('File name sanitized:', file.name, '->', safeName);
  }
}
```

### 3. 환경 변수 관리
```env
# .env.local
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/food-analysis
N8N_WEBHOOK_SECRET=your-webhook-secret-key
```

## ✅ 완료 기준 (Definition of Done)
- [x] Server Actions 기반 n8n 웹훅 연동 시스템 설계 완료
- [x] 재시도 로직 및 에러 처리 설계 완료
- [x] 통합 식단 기록 Server Action 설계 완료
- [x] 웹훅 응답 검증 및 로깅 시스템 설계 완료
- [ ] n8n 웹훅 통신 함수 구현 완료
- [ ] 사용자 인증 확인 로직 구현 완료
- [ ] 파일 검증 로직 구현 완료
- [ ] 응답 데이터 검증 구현 완료
- [ ] 재시도 로직 구현 완료
- [ ] 에러 처리 구현 완료
- [ ] 타임아웃 설정 구현 완료
- [ ] 실제 n8n 웹훅과 연동 테스트 완료

## 🔗 관련 작업
- Task 01: Auth Setup (사용자 인증)
- Task 02: Database Schema (응답 데이터 저장)
- Task 04: Image Upload (API 호출하는 클라이언트)
- Task 08: Error Handling (API 에러 처리)

## 📚 참고 자료
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [n8n Webhook 문서](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
