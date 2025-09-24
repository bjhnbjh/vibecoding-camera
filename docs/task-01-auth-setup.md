# Task 01: Supabase 인증 시스템 구현 (Server Actions 활용)

## 📋 작업 개요
- **작업명**: Supabase 인증 시스템 구현 (Server Actions + 이메일 기반 회원가입/로그인)
- **우선순위**: 높음 (다른 기능들의 기반이 되는 작업)
- **예상 소요시간**: 4-6시간
- **기술 스택**: Next.js 15 Server Actions, Supabase Auth

## 🎯 목표
Next.js 15의 Server Actions를 활용하여 사용자가 이메일과 비밀번호를 통해 회원가입하고 로그인할 수 있는 보안성이 강화된 인증 시스템을 Supabase Auth와 함께 구현한다.

## 📝 상세 요구사항

### 기능적 요구사항
1. **회원가입 기능**
   - 이메일과 비밀번호 입력
   - 이메일 중복 검증
   - 비밀번호 강도 검증 (최소 8자, 영문+숫자 조합)
   - 회원가입 성공 시 이메일 인증 발송

2. **로그인 기능**
   - 이메일과 비밀번호로 로그인
   - 로그인 상태 유지 (세션 관리)
   - 잘못된 인증 정보에 대한 에러 처리

3. **로그아웃 기능**
   - 안전한 세션 종료
   - 로그아웃 후 메인 페이지로 리다이렉트

4. **인증 상태 관리**
   - 로그인 필요한 페이지 접근 제어
   - 인증 상태에 따른 UI 변경

### 비기능적 요구사항
- **보안**: Supabase의 기본 보안 정책 적용
- **UX**: 직관적이고 간단한 인증 플로우
- **모바일 최적화**: 모바일 기기에서 사용하기 편한 UI

## 🛠 기술 구현 사항

### 1. Supabase 클라이언트 설정
```typescript
// lib/supabase/server.ts - 서버용 클라이언트
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Actions에서 쿠키 설정 시 발생할 수 있는 오류 처리
          }
        },
      },
    }
  )
}

// lib/supabase/client.ts - 클라이언트용 클라이언트
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2. 인증 Server Actions
```typescript
// app/auth/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // 폼 데이터 검증
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 기본 검증
  if (!data.email || !data.password) {
    redirect('/auth/login?error=missing-fields')
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/auth/login?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 비밀번호 강도 검증
  if (data.password.length < 8) {
    redirect('/auth/signup?error=password-too-short')
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/auth/signup?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/auth/verify-email')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
```

### 3. 인증 상태 확인 유틸리티
```typescript
// lib/auth/utils.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

export async function redirectIfAuthenticated() {
  const user = await getUser()
  
  if (user) {
    redirect('/')
  }
}
```

### 4. 로그인 폼 컴포넌트
```typescript
// components/auth/LoginForm.tsx
import { login } from '@/app/auth/actions'

export function LoginForm() {
  return (
    <form action={login} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
      >
        로그인
      </button>
    </form>
  )
}
```

### 5. 페이지 구조 및 레이아웃
```typescript
// app/auth/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm'
import { redirectIfAuthenticated } from '@/lib/auth/utils'

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

// app/page.tsx - 메인 페이지에서 인증 상태 확인
import { getUser } from '@/lib/auth/utils'

export default async function HomePage() {
  const user = await getUser()

  return (
    <div>
      {user ? (
        <AuthenticatedView user={user} />
      ) : (
        <UnauthenticatedView />
      )}
    </div>
  )
}
```

### 6. 미들웨어를 통한 라우트 보호
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 사용자 인증 상태 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 보호된 라우트 접근 시 인증 확인
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 인증된 사용자가 auth 페이지 접근 시 홈으로 리다이렉트
  if (request.nextUrl.pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 📊 데이터 모델
Supabase Auth가 기본 제공하는 users 테이블 사용:
- `id`: UUID (Primary Key)
- `email`: 사용자 이메일
- `created_at`: 가입 일시
- `email_confirmed_at`: 이메일 인증 일시

## ✅ 완료 기준 (Definition of Done)
- [x] Server Actions 기반 인증 시스템 설계 완료
- [x] Supabase 클라이언트 설정 (서버/클라이언트 분리) 완료
- [x] 미들웨어 기반 라우트 보호 설계 완료
- [ ] 이메일/비밀번호로 회원가입 가능
- [ ] 이메일/비밀번호로 로그인 가능
- [ ] 로그아웃 기능 동작
- [ ] 인증되지 않은 사용자의 보호된 페이지 접근 차단
- [ ] 로그인 상태에 따른 UI 변경 적용
- [ ] 모바일 기기에서 정상 동작
- [ ] 에러 상황에 대한 적절한 사용자 피드백

## 🔗 관련 작업
- Task 02: Database Schema (인증된 사용자 정보 참조)
- Task 03: Main UI (로그인 상태에 따른 UI 변경)

## 📚 참고 자료
- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
