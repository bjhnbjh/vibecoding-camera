import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://bjhnbjh.app.n8n.cloud/webhook-test/0c4a8156-dfaa-49ba-847c-35b774eeafad';
const FREE_PLAN_LIMIT = 5;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 사용자 인증
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '인증되지 않은 사용자입니다.' } }, { status: 401 });
    }

    // 2. 요금제 및 사용량 확인 (효율적인 방식으로 변경)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, usage_count')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: '프로필 조회에 실패했습니다.' } }, { status: 500 });
    }

    if (profile.plan === 'free' && profile.usage_count >= FREE_PLAN_LIMIT) {
      return NextResponse.json({ success: false, error: { code: 'USAGE_LIMIT_EXCEEDED', message: `무료 사용량을 초과했습니다.` } }, { status: 429 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    if (!imageFile) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_IMAGE', message: '이미지 파일이 필요합니다.' } }, { status: 400 });
    }

    // 3. DB에 분석 기록 사전 생성
    const { data: newAnalysis, error: insertError } = await supabase
      .from('user_analyses')
      .insert({ user_id: user.id, status: 'processing' })
      .select('id')
      .single();

    if (insertError || !newAnalysis) {
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: '분석 기록 생성에 실패했습니다.' } }, { status: 500 });
    }

    const analysisId = newAnalysis.id;

    // 4. n8n 웹훅 호출 (Fire-and-forget)
    const imageBuffer = await imageFile.arrayBuffer();
    const webhookFormData = new FormData();
    webhookFormData.append('image', new Blob([imageBuffer], { type: imageFile.type }), imageFile.name);
    webhookFormData.append('userId', user.id);
    webhookFormData.append('analysisId', analysisId.toString()); // 생성된 분석 ID 전달

    fetch(WEBHOOK_URL, {
      method: 'POST',
      body: webhookFormData,
    }).catch(e => {
      // 호출 실패 시 에러 로깅만 하고, 사용자에게는 영향을 주지 않음
      console.error('N8N Webhook call failed (fire-and-forget)', e);
      // TODO: 실패한 경우를 DB에 기록하여 재시도 로직을 만들 수 있음
    });

    // 5. 프론트엔드에 즉시 응답
    return NextResponse.json(
      { 
        success: true, 
        message: '분석 요청이 접수되었습니다. 잠시 후 결과를 확인하세요.',
        analysisId: analysisId 
      },
      { status: 202 } // 202 Accepted: 요청이 접수되었으며, 처리가 비동기적으로 이루어질 것임을 의미
    );

  } catch (error) {
    console.error('Send-to-webhook Error:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: '요청 처리 중 오류가 발생했습니다.' } }, { status: 500 });
  }
}
