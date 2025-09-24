### **AI 식단 관리 서비스 프로토타입 개발 PRD **

#### **1. 프로젝트 개요 (Overview)**

- **프로젝트명:** 원클릭 AI 식단 기록 서비스 프로토타입
- **핵심 철학:** **"마찰 없는 기록(Frictionless Logging)".** 사용자는 단 하나의 버튼을 눌러 사진을 선택하는 것만으로 식단 기록의 모든 과정을 완료해야 한다. 끼니 선택과 같은 부가적인 사용자 입력은 완전히 배제한다.
- **목표:** 사용자가 음식 사진을 업로드하면, 업로드 시각을 기준으로 끼니를 자동 판별하고, AI 분석부터 데이터베이스 저장까지 모든 과정을 백그라운드에서 자동으로 처리하는 최소한의 UI를 가진 모바일 웹 서비스를 구현한다.

#### **2. 대상 사용자 (Target User)**

- 식단 기록의 필요성은 느끼지만, 매번 정보를 입력하는 과정 자체가 부담스러워 포기했던 사람.
- 가장 직관적이고 빠른 방법으로 자신의 총 섭취 칼로리를 추적하고 싶은 사람.

#### **3. 핵심 사용자 흐름 (Core User Flow)**

1.  **로그인/회원가입:** 사용자는 Supbase 인증을 통해 서비스에 가입하고 로그인한다.
2.  **식단 기록:**
    - 화면 중앙의 '식단 기록하기' 아이콘 또는 버튼을 누른다.
    - 모바일 기기의 카메라 또는 갤러리에서 음식 사진을 선택한다.
    - **선택과 동시에 업로드 및 분석이 시작된다. 사용자의 추가 행동은 일절 필요 없다.**
3.  **결과 확인 및 조회:**
    - 기록이 완료되면 사용자에게 간단한 알림(예: "기록 완료!")을 보여준다.
    - 사용자는 '나의 식단' 페이지에서 날짜별로, 그리고 **자동으로 분류된 끼니(아침/점심/저녁/간식)별**로 기록된 식단을 확인할 수 있다.

#### **4. 주요 기능 명세 (Key Features)**

- **사용자 인증 (Authentication)**

  - Supabase Auth를 이용한 이메일 기반 회원가입 및 로그인 기능.

- **원클릭 식단 기록 (One-Click Logging)**

  - 사용자가 이미지를 선택하는 즉시 백엔드(n8n)로 전송하는 매우 단순한 인터페이스.
  - 로딩 상태를 시각적으로 보여주어 시스템이 동작하고 있음을 인지시킨다.

- **자동 분류 대시보드 (Auto-Categorized Dashboard)**
  - Supabase에 저장된 기록을 조회하여 보여주는 페이지.
  - n8n이 기록 시간을 기준으로 자동 분류한 '아침', '점심', '저녁', '간식' 카테고리별로 식단 내역을 그룹화하여 보여준다.
  - 날짜별 총 섭취 칼로리와 핵심 영양성분 요약 정보를 제공한다.

#### **5. 기술 스택 (Required Tech Stack)**

- **프론트엔드/백엔드:** Next.js (App Router)
- **데이터베이스/인증:** Supabase (Auth, Database)
- **핵심 로직/자동화:** n8n (모든 백엔드 로직 처리)

#### **6. n8n 웹훅 연동 명세 (n8n Webhook Integration) - ⭐ 시간 기반 자동 분류**

- **Request (Next.js → n8n):**

  - Next.js는 이미지 파일과 사용자 ID만을 `multipart/form-data` 형식으로 n8n 웹훅에 POST 요청한다. **끼니 정보는 절대 포함하지 않는다.**
  - **요청 데이터:**
    1.  `image`: 실제 이미지 바이너리 파일
    2.  `userId`: Supabase에서 인증된 사용자의 ID

- **n8n 내부 워크플로우 순서:**

  1.  **[Trigger]** 웹훅으로 `multipart/form-data` 요청을 받는다.
  2.  **[Step 1] 끼니 자동 판별:** 워크플로우가 실행된 **현재 시각(서버 시간 기준)**을 기반으로 끼니 종류를 결정한다.
      - **규칙 예시 (초기 설정):**
        - **아침:** 04:00 ~ 10:59
        - **점심:** 11:00 ~ 16:59
        - **저녁:** 17:00 ~ 21:59
        - **간식:** 22:00 ~ 03:59
      - 이 로직을 통해 `mealType` 변수(예: "점심")를 생성한다.
  3.  **[Step 2] AI 분석:** 수신한 이미지 파일을 외부 AI 분석 서비스로 보내 음식 정보를 분석한다.
  4.  **[Step 3] 파일 저장:** AI 분석이 **성공하면**, 이미지 파일을 Supabase Storage에 업로드한다.
  5.  **[Step 4] 데이터베이스 기록:** Supabase Database의 `food_logs` 테이블에 다음 정보들을 모두 포함하여 새로운 레코드를 삽입한다.
      - AI 분석 결과 (음식 목록, 칼로리, 영양성분 등)
      - Supabase Storage에 저장된 이미지의 URL
      - 요청받은 `userId`
      - **[Step 1]에서 자동 판별한 `mealType`**
  6.  **[Step 5] 결과 반환:** 모든 과정이 성공하면 프론트엔드에 성공 응답을, 중간에 실패하면 실패 응답을 보낸다.

- **Response (n8n → Next.js):**
  - - **성공 시** 응답 본문 예시 (사진에 밥, 김치찌개, 계란말이가 있는 경우):
    ```json
    {
      "success": true,
      "data": {
        "items": [
          {
            "foodName": "현미밥",
            "confidence": 0.98, // AI의 분석 신뢰도 (0.0 ~ 1.0)
            "quantity": "1 공기 (210g)", // AI가 추정한 양
            "calories": 310,
            "nutrients": {
              "carbohydrates": { "value": 68.5, "unit": "g" },
              "protein": { "value": 6.2, "unit": "g" },
              "fat": { "value": 1.5, "unit": "g" },
              "sugars": { "value": 0.5, "unit": "g" },
              "sodium": { "value": 8.0, "unit": "mg" }
            }
          },
          {
            "foodName": "김치찌개",
            "confidence": 0.92,
            "quantity": "1 인분 (400g)",
            "calories": 450,
            "nutrients": {
              "carbohydrates": { "value": 15.2, "unit": "g" },
              "protein": { "value": 25.1, "unit": "g" },
              "fat": { "value": 28.3, "unit": "g" },
              "sugars": { "value": 7.8, "unit": "g" },
              "sodium": { "value": 1800.0, "unit": "mg" }
            }
          },
          {
            "foodName": "계란말이",
            "confidence": 0.95,
            "quantity": "1 접시 (150g)",
            "calories": 280,
            "nutrients": {
              "carbohydrates": { "value": 3.1, "unit": "g" },
              "protein": { "value": 20.5, "unit": "g" },
              "fat": { "value": 20.1, "unit": "g" },
              "sugars": { "value": 1.5, "unit": "g" },
              "sodium": { "value": 450.0, "unit": "mg" }
            }
          }
        ],
        "summary": {
          // 프론트엔드 계산 부담을 덜어주기 위한 전체 요약 정보
          "totalCalories": 1040,
          "totalCarbohydrates": { "value": 86.8, "unit": "g" },
          "totalProtein": { "value": 51.8, "unit": "g" },
          "totalFat": { "value": 49.9, "unit": "g" }
        }
      }
    }
    ```
  - **실패 시** 응답 본문 예시:
    `json
{
  "success": false,
  "error": {
    "code": "NO_FOOD_DETECTED", // 에러 종류를 나타내는 코드
    "message": "이미지에서 음식을 찾을 수 없습니다. 다른 사진으로 시도해주세요." // 사용자에게 보여줄 수 있는 메시지
  }
}
`
