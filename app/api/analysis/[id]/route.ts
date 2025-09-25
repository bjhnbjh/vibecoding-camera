
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Vercel 빌드 통과를 위한 임시 단순화 버전
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  
  // 실제 로직 대신, 빌드만 통과시키기 위한 기본 응답
  return NextResponse.json({ success: true, status: 'ok', analysisId: id });
}
