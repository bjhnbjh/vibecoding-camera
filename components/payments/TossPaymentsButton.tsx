'use client';

import { loadTossPayments } from '@tosspayments/payment-sdk';
import { nanoid } from 'nanoid';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export default function TossPaymentsButton() {

  const handlePayment = async () => {
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
    
    tossPayments.requestPayment('카드', {
      amount: 0, // 테스트를 위해 0원으로 설정
      orderId: `toss_order_${nanoid()}`,
      orderName: 'AI 식단 기록 프리미엄 (테스트)',
      customerName: '고객님', // 실제로는 사용자 이름으로 대체해야 합니다.
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    }).catch(function (error) {
      if (error.code === 'USER_CANCEL') {
        alert('결제를 취소하셨습니다.');
      } else {
        alert(`결제 실패: ${error.message}`);
      }
    });
  };

  return (
    <button 
      onClick={handlePayment}
      className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 text-lg shadow-lg"
    >
      테스트 결제 진행하기 (0원)
    </button>
  );
}
