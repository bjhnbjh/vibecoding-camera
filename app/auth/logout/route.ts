import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase logout error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // 로그아웃 성공 응답과 함께 캐시 정리 헤더 추가
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.'
    })

    // 클라이언트에서 인증 관련 캐시를 정리할 수 있도록 헤더 추가
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    // Supabase 관련 쿠키들을 명시적으로 삭제
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token'
    ]

    // 모든 가능한 쿠키 정리
    authCookies.forEach(cookieName => {
      // httpOnly 쿠키 (서버에서만 접근 가능)
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      // 클라이언트에서 접근 가능한 쿠키도 정리
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    // 추가적인 보안 헤더
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')
    response.headers.set('X-Logout', 'true')

    console.log('Logout successful, cookies cleared')
    console.log('Set cookies:', authCookies)
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
