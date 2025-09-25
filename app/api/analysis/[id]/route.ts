
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest, 
  context: { params: { id: string } }
): Promise<NextResponse> { // 함수의 반환 타입을 명시적으로 지정
  try {
    const supabase = await createClient();
    const analysisId = context.params.id;

    // 1. 사용자 인증 (더 안정적인 방식으로 수정)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '인증되지 않은 사용자입니다.' } }, { status: 401 });
    }

    if (!analysisId) {
        return NextResponse.json({ success: false, error: { code: 'MISSING_PARAMETER', message: '분석 ID가 필요합니다.' } }, { status: 400 });
    }

    // 2. DB에서 해당 분석 결과 조회
    const { data: analysis, error: dbError } = await supabase
      .from('user_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', user.id) // 본인의 분석 결과만 조회 가능
      .single();

    if (dbError) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '분석 결과를 찾을 수 없습니다.' } }, { status: 404 });
    }

    // 3. 조회된 결과 반환
    return NextResponse.json({ success: true, data: analysis });

  } catch (error) {
    console.error('Get Analysis Error:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: '요청 처리 중 오류가 발생했습니다.' } }, { status: 500 });
  }
}
