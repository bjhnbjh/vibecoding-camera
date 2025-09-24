'use client';

interface AuthPromptProps {
  onLogin: () => void;
}

export default function AuthPrompt({ onLogin }: AuthPromptProps) {
  return (
    <div className="max-w-md text-center space-y-8">
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">📸</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 leading-tight">
          사진 한 장으로<br />
          <span className="text-emerald-600">식단 기록 완료</span>
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          복잡한 입력은 그만! AI가 자동으로 음식을 분석하고 
          칼로리와 영양성분을 기록해드립니다.
        </p>
      </div>

      {/* 특징 소개 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-600">⚡</span>
          </div>
          <span className="text-gray-700">원클릭으로 즉시 기록</span>
        </div>
        <div className="flex items-center space-x-3 text-left">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-600">🤖</span>
          </div>
          <span className="text-gray-700">AI가 자동으로 음식 분석</span>
        </div>
        <div className="flex items-center space-x-3 text-left">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-600">📊</span>
          </div>
          <span className="text-gray-700">시간대별 자동 분류</span>
        </div>
      </div>

      <button
        onClick={onLogin}
        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold text-lg hover:bg-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
      >
        지금 시작하기
      </button>
    </div>
  );
}
