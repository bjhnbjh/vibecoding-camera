# Task 07: 식단 조회 대시보드 구현 (Server Actions + RSC 활용)

## 📋 작업 개요
- **작업명**: 식단 조회 대시보드 구현 (Server Actions + React Server Components)
- **우선순위**: 높음 (핵심 기능)
- **예상 소요시간**: 6-8시간
- **기술 스택**: Next.js 15 Server Actions, React Server Components, Supabase

## 🎯 목표
Next.js 15의 Server Actions와 React Server Components를 활용하여 사용자가 기록한 식단을 날짜별, 끼니별로 분류하여 보여주고, 서버에서 미리 계산된 일일 칼로리 및 영양성분 요약 정보를 제공하는 고성능 대시보드를 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **날짜별 식단 조회**
   - 캘린더 인터페이스로 날짜 선택
   - 선택된 날짜의 모든 식단 기록 표시
   - 오늘 날짜 기본 선택

2. **끼니별 분류 표시**
   - 아침, 점심, 저녁, 간식으로 자동 분류
   - 각 끼니별 칼로리 및 영양성분 요약
   - 끼니별 음식 목록 상세 표시

3. **영양성분 요약**
   - 일일 총 칼로리
   - 탄수화물, 단백질, 지방 섭취량
   - 권장 섭취량 대비 비율 표시

4. **식단 기록 상세 정보**
   - 음식 사진 표시
   - AI 분석 결과 (음식명, 양, 신뢰도)
   - 개별 음식별 영양성분

### 비기능적 요구사항
- **성능**: 빠른 데이터 로딩 및 부드러운 스크롤
- **사용성**: 직관적인 네비게이션 및 정보 구조
- **반응형**: 모바일 우선 설계

## 🛠 기술 구현 사항

### 1. Server Component 기반 페이지 구조
```typescript
// app/dashboard/page.tsx - React Server Component
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/utils'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DateSelector } from '@/components/dashboard/DateSelector'
import { NutritionSummary } from '@/components/dashboard/NutritionSummary'
import { MealSections } from '@/components/dashboard/MealSections'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

interface DashboardPageProps {
  searchParams: { date?: string }
}

export default async function DashboardPage({ 
  searchParams 
}: DashboardPageProps) {
  // 서버에서 인증 확인
  const user = await requireAuth()
  
  // URL에서 날짜 파라미터 추출 (기본값: 오늘)
  const selectedDate = searchParams.date 
    ? new Date(searchParams.date) 
    : new Date()

  // 잘못된 날짜 형식 처리
  if (isNaN(selectedDate.getTime())) {
    redirect('/dashboard')
  }

  return (
    <div className="dashboard-container max-w-4xl mx-auto p-4 space-y-6">
      <DashboardHeader user={user} />
      
      <DateSelector selectedDate={selectedDate} />
      
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent 
          userId={user.id} 
          selectedDate={selectedDate} 
        />
      </Suspense>
    </div>
  )
}

// 별도 컴포넌트로 분리하여 Suspense 경계 설정
async function DashboardContent({ 
  userId, 
  selectedDate 
}: { 
  userId: string
  selectedDate: Date 
}) {
  // 서버에서 데이터 페칭
  const { foodLogs, nutritionSummary } = await getFoodLogsByDate(userId, selectedDate)
  
  return (
    <>
      <NutritionSummary 
        summary={nutritionSummary}
        selectedDate={selectedDate}
      />
      <MealSections 
        foodLogs={foodLogs}
        selectedDate={selectedDate}
      />
    </>
  )
}
```

### 2. Server Action 기반 데이터 페칭
```typescript
// app/actions/dashboard.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface FoodLog {
  id: string
  user_id: string
  image_url: string
  analysis_result: any
  total_calories: number
  total_carbohydrates: number
  total_protein: number
  total_fat: number
  meal_type: string
  confidence_score: number
  created_at: string
}

interface NutritionSummary {
  totalCalories: number
  totalCarbohydrates: number
  totalProtein: number
  totalFat: number
  mealCount: number
  averageConfidence: number
}

export async function getFoodLogsByDate(
  userId: string,
  date: Date
): Promise<{
  foodLogs: FoodLog[]
  nutritionSummary: NutritionSummary
}> {
  try {
    // 인증 확인
    const user = await requireAuth()
    if (user.id !== userId) {
      throw new Error('Unauthorized access')
    }

    const supabase = createClient()
    
    // 날짜 범위 설정 (해당 날짜의 00:00:00 ~ 23:59:59)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // 식단 기록 조회
    const { data: foodLogs, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      throw new Error('식단 기록을 불러오는데 실패했습니다.')
    }

    // 영양성분 요약 계산
    const nutritionSummary = calculateNutritionSummary(foodLogs || [])

    return {
      foodLogs: foodLogs || [],
      nutritionSummary
    }

  } catch (error) {
    console.error('getFoodLogsByDate error:', error)
    throw error
  }
}

// 날짜 변경 Server Action
export async function changeDashboardDate(formData: FormData) {
  const date = formData.get('date') as string
  
  if (!date) {
    redirect('/dashboard')
  }
  
  // 날짜 유효성 검증
  const selectedDate = new Date(date)
  if (isNaN(selectedDate.getTime())) {
    redirect('/dashboard')
  }
  
  redirect(`/dashboard?date=${date}`)
}

// 식단 기록 삭제 Server Action
export async function deleteFoodLog(formData: FormData) {
  try {
    const user = await requireAuth()
    const logId = formData.get('logId') as string
    
    if (!logId) {
      throw new Error('Log ID is required')
    }

    const supabase = createClient()
    
    // 해당 기록이 현재 사용자의 것인지 확인
    const { data: log, error: fetchError } = await supabase
      .from('food_logs')
      .select('user_id, image_url')
      .eq('id', logId)
      .single()

    if (fetchError || !log) {
      throw new Error('식단 기록을 찾을 수 없습니다.')
    }

    if (log.user_id !== user.id) {
      throw new Error('권한이 없습니다.')
    }

    // 데이터베이스에서 기록 삭제
    const { error: deleteError } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', logId)

    if (deleteError) {
      throw new Error('식단 기록 삭제에 실패했습니다.')
    }

    // 관련된 이미지 파일도 삭제 (선택적)
    if (log.image_url) {
      const fileName = log.image_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('food-images')
          .remove([`${user.id}/${fileName}`])
      }
    }

    // 캐시 재검증
    revalidatePath('/dashboard')
    
    return { success: true, message: '식단 기록이 삭제되었습니다.' }

  } catch (error) {
    console.error('Delete food log error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.' 
    }
  }
}

// 영양성분 요약 계산 함수
function calculateNutritionSummary(foodLogs: FoodLog[]): NutritionSummary {
  if (foodLogs.length === 0) {
    return {
      totalCalories: 0,
      totalCarbohydrates: 0,
      totalProtein: 0,
      totalFat: 0,
      mealCount: 0,
      averageConfidence: 0
    }
  }

  const summary = foodLogs.reduce((acc, log) => {
    acc.totalCalories += log.total_calories || 0
    acc.totalCarbohydrates += log.total_carbohydrates || 0
    acc.totalProtein += log.total_protein || 0
    acc.totalFat += log.total_fat || 0
    acc.totalConfidence += log.confidence_score || 0
    return acc
  }, {
    totalCalories: 0,
    totalCarbohydrates: 0,
    totalProtein: 0,
    totalFat: 0,
    totalConfidence: 0
  })

  return {
    ...summary,
    mealCount: foodLogs.length,
    averageConfidence: summary.totalConfidence / foodLogs.length
  }
}
```

### 3. 클라이언트 컴포넌트 (상호작용 필요한 부분만)
```typescript
// components/dashboard/DateSelector.tsx
'use client'

import { useState, useTransition } from 'react'
import { changeDashboardDate } from '@/app/actions/dashboard'

interface DateSelectorProps {
  selectedDate: Date
}

export function DateSelector({ selectedDate }: DateSelectorProps) {
  const [isPending, startTransition] = useTransition()
  
  const handleDateChange = (newDate: Date) => {
    const formData = new FormData()
    formData.append('date', newDate.toISOString().split('T')[0])
    
    startTransition(() => {
      changeDashboardDate(formData)
    })
  }

  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate)
    previousDay.setDate(previousDay.getDate() - 1)
    handleDateChange(previousDay)
  }

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    handleDateChange(nextDay)
  }

  const goToToday = () => {
    handleDateChange(new Date())
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="date-selector bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousDay}
          disabled={isPending}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          aria-label="이전 날"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short'
            })}
          </h2>
          {isToday && (
            <span className="inline-block px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full mt-1">
              오늘
            </span>
          )}
        </div>
        
        <button
          onClick={goToNextDay}
          disabled={isPending || isToday}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          aria-label="다음 날"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
      
      {!isToday && (
        <button
          onClick={goToToday}
          disabled={isPending}
          className="w-full mt-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
        >
          오늘로 이동
        </button>
      )}
      
      {isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// components/dashboard/FoodLogCard.tsx - 삭제 기능 포함
'use client'

import { useState, useTransition } from 'react'
import { deleteFoodLog } from '@/app/actions/dashboard'

interface FoodLogCardProps {
  foodLog: FoodLog
}

export function FoodLogCard({ foodLog }: FoodLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const handleDelete = () => {
    const formData = new FormData()
    formData.append('logId', foodLog.id)
    
    startTransition(async () => {
      const result = await deleteFoodLog(formData)
      if (result.success) {
        // 성공 시 UI 피드백 (토스트 등)
        console.log(result.message)
      } else {
        // 에러 시 UI 피드백
        console.error(result.error)
      }
      setShowDeleteConfirm(false)
    })
  }

  const analysisResult = foodLog.analysis_result as AnalysisResult

  return (
    <div className="food-log-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="card-header p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="food-image">
            <img 
              src={foodLog.image_url} 
              alt="음식 사진"
              className="w-16 h-16 object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="food-names">
              {analysisResult.items.slice(0, 2).map((item, index) => (
                <span key={index} className="inline-block text-sm font-medium text-gray-900 mr-2">
                  {item.foodName}
                </span>
              ))}
              {analysisResult.items.length > 2 && (
                <span className="text-sm text-gray-500">
                  외 {analysisResult.items.length - 2}개
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
              <span className="font-medium text-emerald-600">
                {foodLog.total_calories}kcal
              </span>
              <span>•</span>
              <span>
                {new Date(foodLog.created_at).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              disabled={isPending}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label="삭제"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* 확장된 상세 정보 */}
      {isExpanded && (
        <div className="card-details border-t border-gray-100 p-4">
          <div className="space-y-4">
            {/* 영양성분 바 */}
            <NutritionBar
              carbs={foodLog.total_carbohydrates}
              protein={foodLog.total_protein}
              fat={foodLog.total_fat}
            />
            
            {/* 개별 음식 목록 */}
            <div className="space-y-2">
              {analysisResult.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="font-medium text-gray-900">{item.foodName}</span>
                    <div className="text-sm text-gray-500">
                      {item.quantity} • 신뢰도 {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                  <span className="font-medium text-emerald-600">
                    {item.calories}kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              식단 기록 삭제
            </h3>
            <p className="text-gray-600 mb-4">
              이 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3. 날짜 선택 컴포넌트
```typescript
// components/DateSelector.tsx
interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  return (
    <div className="date-selector">
      <div className="date-navigation">
        <button
          onClick={() => onDateChange(subDays(selectedDate, 1))}
          className="nav-button"
          aria-label="이전 날"
        >
          <ChevronLeftIcon />
        </button>
        
        <div className="current-date">
          <h2 className="date-text">
            {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
          </h2>
          {isToday && <span className="today-badge">오늘</span>}
        </div>
        
        <button
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          className="nav-button"
          disabled={isToday}
          aria-label="다음 날"
        >
          <ChevronRightIcon />
        </button>
      </div>
      
      <button
        onClick={() => onDateChange(today)}
        className="today-button"
        disabled={isToday}
      >
        오늘로 이동
      </button>
    </div>
  );
}
```

### 4. 영양성분 요약 컴포넌트
```typescript
// components/NutritionSummary.tsx
interface NutritionSummaryProps {
  foodLogs: FoodLog[];
  date: Date;
}

export function NutritionSummary({ foodLogs, date }: NutritionSummaryProps) {
  const summary = useMemo(() => {
    return foodLogs.reduce((acc, log) => {
      acc.totalCalories += log.total_calories || 0;
      acc.totalCarbs += log.total_carbohydrates || 0;
      acc.totalProtein += log.total_protein || 0;
      acc.totalFat += log.total_fat || 0;
      return acc;
    }, {
      totalCalories: 0,
      totalCarbs: 0,
      totalProtein: 0,
      totalFat: 0
    });
  }, [foodLogs]);

  // 권장 섭취량 (성인 기준)
  const recommendations = {
    calories: 2000,
    carbs: 300,
    protein: 50,
    fat: 65
  };

  return (
    <div className="nutrition-summary">
      <div className="summary-header">
        <h3>일일 영양 요약</h3>
        <span className="meal-count">{foodLogs.length}회 식사</span>
      </div>

      <div className="nutrition-cards">
        <NutritionCard
          label="칼로리"
          value={summary.totalCalories}
          unit="kcal"
          recommended={recommendations.calories}
          color="#ef4444"
        />
        <NutritionCard
          label="탄수화물"
          value={summary.totalCarbs}
          unit="g"
          recommended={recommendations.carbs}
          color="#3b82f6"
        />
        <NutritionCard
          label="단백질"
          value={summary.totalProtein}
          unit="g"
          recommended={recommendations.protein}
          color="#10b981"
        />
        <NutritionCard
          label="지방"
          value={summary.totalFat}
          unit="g"
          recommended={recommendations.fat}
          color="#f59e0b"
        />
      </div>
    </div>
  );
}
```

### 5. 끼니별 섹션 컴포넌트
```typescript
// components/MealSections.tsx
const MEAL_TYPES = ['아침', '점심', '저녁', '간식'] as const;

interface MealSectionsProps {
  foodLogs: FoodLog[];
  isLoading: boolean;
}

export function MealSections({ foodLogs, isLoading }: MealSectionsProps) {
  const mealGroups = useMemo(() => {
    return MEAL_TYPES.reduce((acc, mealType) => {
      acc[mealType] = foodLogs.filter(log => log.meal_type === mealType);
      return acc;
    }, {} as Record<string, FoodLog[]>);
  }, [foodLogs]);

  if (isLoading) {
    return <MealSectionsSkeleton />;
  }

  return (
    <div className="meal-sections">
      {MEAL_TYPES.map(mealType => (
        <MealSection
          key={mealType}
          mealType={mealType}
          foodLogs={mealGroups[mealType]}
        />
      ))}
    </div>
  );
}

// components/MealSection.tsx
interface MealSectionProps {
  mealType: string;
  foodLogs: FoodLog[];
}

export function MealSection({ mealType, foodLogs }: MealSectionProps) {
  const mealCalories = foodLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);

  return (
    <div className="meal-section">
      <div className="meal-header">
        <h4 className="meal-title">{mealType}</h4>
        <span className="meal-calories">{mealCalories}kcal</span>
      </div>

      {foodLogs.length === 0 ? (
        <div className="empty-meal">
          <p>기록된 식단이 없습니다</p>
        </div>
      ) : (
        <div className="food-logs">
          {foodLogs.map(log => (
            <FoodLogCard key={log.id} foodLog={log} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6. 식단 기록 카드 컴포넌트
```typescript
// components/FoodLogCard.tsx
interface FoodLogCardProps {
  foodLog: FoodLog;
}

export function FoodLogCard({ foodLog }: FoodLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const analysisResult = foodLog.analysis_result as AnalysisResult;

  return (
    <div className="food-log-card">
      <div className="card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="food-image">
          <img 
            src={foodLog.image_url} 
            alt="음식 사진"
            className="food-photo"
          />
        </div>
        
        <div className="food-info">
          <div className="food-names">
            {analysisResult.items.slice(0, 2).map((item, index) => (
              <span key={index} className="food-name">
                {item.foodName}
              </span>
            ))}
            {analysisResult.items.length > 2 && (
              <span className="more-foods">
                외 {analysisResult.items.length - 2}개
              </span>
            )}
          </div>
          
          <div className="food-meta">
            <span className="calories">{foodLog.total_calories}kcal</span>
            <span className="time">
              {format(new Date(foodLog.created_at), 'HH:mm')}
            </span>
          </div>
        </div>
        
        <ChevronDownIcon 
          className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="card-details">
          <div className="nutrition-breakdown">
            <NutritionBar
              carbs={foodLog.total_carbohydrates || 0}
              protein={foodLog.total_protein || 0}
              fat={foodLog.total_fat || 0}
            />
          </div>
          
          <div className="food-items">
            {analysisResult.items.map((item, index) => (
              <div key={index} className="food-item">
                <div className="item-header">
                  <span className="item-name">{item.foodName}</span>
                  <span className="item-calories">{item.calories}kcal</span>
                </div>
                <div className="item-details">
                  <span className="quantity">{item.quantity}</span>
                  <span className="confidence">
                    신뢰도 {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 📊 데이터 시각화

### 영양성분 프로그레스 바
```typescript
// components/NutritionCard.tsx
interface NutritionCardProps {
  label: string;
  value: number;
  unit: string;
  recommended: number;
  color: string;
}

export function NutritionCard({ 
  label, 
  value, 
  unit, 
  recommended, 
  color 
}: NutritionCardProps) {
  const percentage = Math.min((value / recommended) * 100, 100);
  const isOver = value > recommended;

  return (
    <div className="nutrition-card">
      <div className="card-header">
        <span className="label">{label}</span>
        <span className={`percentage ${isOver ? 'over' : ''}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      
      <div className="progress-container">
        <div 
          className="progress-bar"
          style={{ backgroundColor: `${color}20` }}
        >
          <div
            className="progress-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
      
      <div className="values">
        <span className="current">{value.toFixed(1)}{unit}</span>
        <span className="recommended">/ {recommended}{unit}</span>
      </div>
    </div>
  );
}
```

## 📱 모바일 최적화

### 반응형 레이아웃
```css
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

/* 모바일 */
.nutrition-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.meal-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 태블릿 */
@media (min-width: 768px) {
  .nutrition-cards {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .dashboard-container {
    padding: 24px;
  }
  
  .meal-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}
```

## ✅ 완료 기준 (Definition of Done)
- [x] React Server Components 기반 대시보드 구조 설계 완료
- [x] Server Actions 기반 데이터 페칭 시스템 설계 완료
- [x] useTransition 훅 활용 클라이언트 컴포넌트 설계 완료
- [x] 식단 기록 삭제 Server Action 설계 완료
- [x] 날짜 선택 인터페이스 구현 완료
- [x] 끼니별 식단 분류 표시 구현 완료
- [x] 영양성분 요약 카드 구현 완료
- [ ] 식단 기록 상세 카드 구현 완료
- [ ] 데이터 로딩 및 에러 처리 구현 완료
- [x] 모바일 반응형 디자인 적용 완료
- [x] 성능 최적화 (메모이제이션) 적용 완룼
- [x] 접근성 기능 구현 완료
- [ ] 실제 데이터로 테스트 완료

## 🔗 관련 작업
- Task 02: Database Schema (데이터 조회)
- Task 01: Auth Setup (사용자 인증)
- Task 08: Error Handling (데이터 로딩 에러)

## 📚 참고 자료
- [date-fns 라이브러리](https://date-fns.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Chart.js](https://www.chartjs.org/) (고급 차트가 필요한 경우)
- [Supabase 실시간 구독](https://supabase.com/docs/guides/realtime)
