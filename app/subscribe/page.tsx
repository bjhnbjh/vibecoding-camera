
import TossPaymentsButton from '@/components/payments/TossPaymentsButton';

export default function SubscribePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-black sm:text-6xl md:text-7xl">
          프리미엄 플랜
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
          AI 식단 기록 서비스를 무제한으로 이용하고, 더 건강한 라이프스타일을 만들어보세요.
        </p>
      </div>

      <div className="mt-12 neo-card p-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-black">Premium Plan</h2>
        <p className="mt-2 text-slate-600">모든 기능을 무제한으로 사용하세요.</p>
        
        <div className="mt-6">
          <span className="text-5xl font-extrabold text-black">₩0</span>
          <span className="text-xl font-medium text-slate-500">/ 월 (테스트)</span>
        </div>

        <ul className="mt-8 space-y-4 text-slate-700">
          <li className="flex items-start">
            <span className="text-emerald-500 mr-3">✔️</span>
            <span className="font-medium">무제한 식단 기록</span>
          </li>
          <li className="flex items-start">
            <span className="text-emerald-500 mr-3">✔️</span>
            <span className="font-medium">상세 영양 정보 분석 (예정)</span>
          </li>
          <li className="flex items-start">
            <span className="text-emerald-500 mr-3">✔️</span>
            <span className="font-medium">주간/월간 리포트 (예정)</span>
          </li>
        </ul>

        <div className="mt-10">
          <TossPaymentsButton />
        </div>
      </div>
    </div>
  );
}
