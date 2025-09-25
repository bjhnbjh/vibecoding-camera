'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('결제를 승인하는 중입니다...');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setMessage('잘못된 접근입니다.');
      return;
    }

    fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setMessage('결제가 성공적으로 완료되었습니다! 프리미엄 플랜이 활성화되었습니다.');
      } else {
        setMessage(`결제 승인 실패: ${result.error?.message || '알 수 없는 오류'}`);
      }
    })
    .catch(err => {
      setMessage(`네트워크 오류: ${err.message}`);
    });

  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">결제 상태</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
