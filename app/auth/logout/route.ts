import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // 로그아웃 성공 응답과 함께 캐시 정리 헤더 추가
    const response = NextResponse.json({ success: true })

    // 클라이언트에서 인증 관련 캐시를 정리할 수 있도록 헤더 추가
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    // Supabase 관련 쿠키들을 명시적으로 삭제
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ]

    authCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
