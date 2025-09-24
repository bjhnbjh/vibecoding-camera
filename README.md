# Camera - AI 식단 분석 앱 📸

## 🔧 Google OAuth 설정

Google 로그인을 사용하려면 다음 단계를 따라주세요:

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)로 이동
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > OAuth 동의 화면**에서 동의 화면 구성
4. **API 및 서비스 > 사용자 인증 정보**에서 OAuth 2.0 클라이언트 ID 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `http://localhost:3000/auth/api/google`

### 2. Supabase에서 Google OAuth 구성

1. [Supabase Dashboard](https://app.supabase.com)로 이동
2. **Authentication > Providers**에서 Google 제공자 활성화
3. Google Cloud Console에서 얻은 Client ID와 Client Secret 입력

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용 추가:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Google 로그인 사용법

- 로그인 페이지: `/auth/login` - Google로 로그인 버튼
- 회원가입 페이지: `/auth/signup` - Google로 계속하기 버튼

## 🚀 주요 기능

- 📸 **AI 식단 분석**: 사진 한 장으로 자동 식단 분석
- 🔐 **보안 인증**: Supabase 기반 이메일/비밀번호 + Google OAuth
- 📱 **반응형 디자인**: 모바일과 데스크톱 최적화
- 📊 **대시보드**: 식단 기록 및 통계

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
