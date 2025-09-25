
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// n8n과 서버만이 아는 비밀 키. n8n의 HTTP Request 노드 헤더에 추가해야 합니다.
const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET || 'super-secret-key';

// 이 API는 서버 간 통신이므로, RLS를 우회하는 service_role 키를 사용합니다.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1. 요청이 n8n에게서 온 것인지 비밀 키로 확인
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${N8N_CALLBACK_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. n8n이 보낸 최종 분석 결과 데이터 추출
    const result = await request.json();
    const { analysisId, analysisResult, summary, mealName } = result;

    if (!analysisId) {
      return NextResponse.json({ success: false, error: 'analysisId is required' }, { status: 400 });
    }

    // 3. 해당 분석 ID의 레코드를 DB에서 찾아 결과 업데이트
    const { error: updateError } = await supabase
      .from('user_analyses')
      .update({
        status: 'complete',
        analysis_result: analysisResult, // n8n이 보내준 전체 JSON 결과
        meal_name: mealName, // n8n이 보내준 음식 이름
        total_calories: summary?.totalCalories,
        total_carbohydrates: summary?.totalCarbohydrates?.value,
        total_protein: summary?.totalProtein?.value,
        total_fat: summary?.totalFat?.value,
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('n8n-callback: DB update error', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 4. (중요) 무료 사용자의 경우 사용량 1 증가
    // 이 로직은 n8n에서 분기처리 하거나, 여기서 처리할 수 있습니다.
    // 여기서는 간단하게 사용자 ID를 받아와서 처리하는 로직을 추가합니다.
    const { userId } = result;
    if (userId) {
        const { data: profile } = await supabase.from('profiles').select('plan, usage_count').eq('id', userId).single();
        if (profile && profile.plan === 'free') {
            await supabase.from('profiles').update({ usage_count: profile.usage_count + 1 }).eq('id', userId);
        }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('n8n-callback Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
