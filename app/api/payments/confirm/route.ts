
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWd20k6Vj59752zmj4';

export async function POST(request: NextRequest) {
  const { paymentKey, orderId, amount } = await request.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: { message: result.message || '결제 승인 실패' } }, { status: response.status });
    }

    // 결제 승인 성공 시, DB에 사용자 플랜 업데이트
    // 참고: 현재 스키마의 비효율성으로 인해 모든 레코드를 업데이트해야 합니다.
    const { error: updateError } = await supabase
      .from('user_analyses')
      .update({ plan: 'premium', usage_count: 0 })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('DB 업데이트 오류:', updateError);
      // 결제는 됐지만 DB 업데이트가 실패한 경우, 수동 처리가 필요함을 로깅
      return NextResponse.json({ success: false, error: { message: 'DB 업데이트 실패. 관리자에게 문의하세요.' } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('결제 승인 중 서버 오류:', error);
    return NextResponse.json({ success: false, error: { message: '내부 서버 오류' } }, { status: 500 });
  }
}
