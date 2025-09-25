'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h1>
        <p className="text-gray-700">오류 코드: {code}</p>
        <p className="text-gray-700 mt-2">오류 메시지: {message}</p>
        <Link href="/subscribe" className="mt-6 inline-block bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors">
          결제 다시 시도
        </Link>
      </div>
    </div>
  );
}
