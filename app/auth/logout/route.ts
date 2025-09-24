import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('Logout API called')

    const supabase = await createClient()
    console.log('Supabase client created')

    const { error } = await supabase.auth.signOut()
    console.log('Supabase signOut result:', { error })

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

    console.log('Logout successful')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
