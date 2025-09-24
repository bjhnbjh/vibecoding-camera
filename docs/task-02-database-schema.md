# Task 02: Supabase Database 스키마 설계 및 food_logs 테이블 생성

## 📋 작업 개요
- **작업명**: Supabase Database 스키마 설계 및 food_logs 테이블 생성
- **우선순위**: 높음 (데이터 저장의 핵심)
- **예상 소요시간**: 3-4시간

## 🎯 목표
AI 분석 결과와 사용자의 식단 기록을 저장할 수 있는 데이터베이스 스키마를 설계하고 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **food_logs 테이블 생성**
   - 사용자별 식단 기록 저장
   - AI 분석 결과 저장 (음식명, 칼로리, 영양성분)
   - 자동 분류된 끼니 정보 저장
   - 이미지 URL 저장

2. **데이터 무결성 보장**
   - 외래키 제약조건 설정
   - 필수 필드 NOT NULL 제약
   - 적절한 데이터 타입 설정

3. **성능 최적화**
   - 조회 성능을 위한 인덱스 설정
   - 날짜 기반 조회 최적화

## 🛠 데이터베이스 스키마

### food_logs 테이블
```sql
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('아침', '점심', '저녁', '간식')),
  analysis_result JSONB NOT NULL,
  total_calories INTEGER,
  total_carbohydrates DECIMAL(8,2),
  total_protein DECIMAL(8,2),
  total_fat DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_created_at ON food_logs(created_at);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, DATE(created_at));
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);

-- RLS (Row Level Security) 정책
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food logs" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);
```

### analysis_result JSONB 구조
```json
{
  "items": [
    {
      "foodName": "현미밥",
      "confidence": 0.98,
      "quantity": "1 공기 (210g)",
      "calories": 310,
      "nutrients": {
        "carbohydrates": { "value": 68.5, "unit": "g" },
        "protein": { "value": 6.2, "unit": "g" },
        "fat": { "value": 1.5, "unit": "g" },
        "sugars": { "value": 0.5, "unit": "g" },
        "sodium": { "value": 8.0, "unit": "mg" }
      }
    }
  ],
  "summary": {
    "totalCalories": 1040,
    "totalCarbohydrates": { "value": 86.8, "unit": "g" },
    "totalProtein": { "value": 51.8, "unit": "g" },
    "totalFat": { "value": 49.9, "unit": "g" }
  }
}
```

## 📊 TypeScript 타입 정의

```typescript
// types/database.ts
export interface FoodLog {
  id: string;
  user_id: string;
  image_url: string;
  meal_type: '아침' | '점심' | '저녁' | '간식';
  analysis_result: AnalysisResult;
  total_calories: number;
  total_carbohydrates: number;
  total_protein: number;
  total_fat: number;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  items: FoodItem[];
  summary: NutrientSummary;
}

export interface FoodItem {
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
}

export interface NutrientSummary {
  totalCalories: number;
  totalCarbohydrates: { value: number; unit: string };
  totalProtein: { value: number; unit: string };
  totalFat: { value: number; unit: string };
}
```

## 🔧 데이터베이스 함수 및 트리거

### updated_at 자동 업데이트 트리거
```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_food_logs_updated_at 
  BEFORE UPDATE ON food_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 일별 통계 뷰
```sql
CREATE VIEW daily_nutrition_summary AS
SELECT 
  user_id,
  DATE(created_at) as log_date,
  COUNT(*) as total_meals,
  SUM(total_calories) as daily_calories,
  SUM(total_carbohydrates) as daily_carbs,
  SUM(total_protein) as daily_protein,
  SUM(total_fat) as daily_fat
FROM food_logs
GROUP BY user_id, DATE(created_at);
```

## ✅ 완료 기준 (Definition of Done)
- [ ] food_logs 테이블 생성 완료
- [ ] 적절한 인덱스 설정 완료
- [ ] RLS 정책 설정 완료
- [ ] TypeScript 타입 정의 완료
- [ ] 트리거 및 함수 설정 완료
- [ ] 데이터 무결성 제약조건 설정 완료
- [ ] 테스트 데이터 삽입/조회 성공

## 🔗 관련 작업
- Task 01: Auth Setup (user_id 외래키 참조)
- Task 05: n8n Webhook (데이터 저장 로직)
- Task 07: Dashboard (데이터 조회 로직)

## 📚 참고 자료
- [Supabase Database 공식 문서](https://supabase.com/docs/guides/database)
- [PostgreSQL JSONB 타입](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
