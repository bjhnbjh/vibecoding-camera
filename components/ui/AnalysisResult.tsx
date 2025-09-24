'use client';

import { AnalysisResult as AnalysisResultType } from '@/types/analysis';

interface AnalysisResultProps {
  result: AnalysisResultType;
  onClose: () => void;
}

export default function AnalysisResult({ result, onClose }: AnalysisResultProps) {
  const { items, summary } = result;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">식단 분석 결과</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 분석 결과 내용 */}
        <div className="p-6 space-y-6">
          {/* 분석된 음식 요약 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">보내주신 사진으로 분석한 결과입니다!</h3>
          </div>

          {/* 전체 요약 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">전체 요약</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalCalories}</div>
                <div className="text-sm text-gray-600">칼로리</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {summary.totalProtein.value}{summary.totalProtein.unit}
                </div>
                <div className="text-sm text-gray-600">단백질</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {summary.totalCarbohydrates.value}{summary.totalCarbohydrates.unit}
                </div>
                <div className="text-sm text-gray-600">탄수화물</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {summary.totalFat.value}{summary.totalFat.unit}
                </div>
                <div className="text-sm text-gray-600">지방</div>
              </div>
            </div>
          </div>

          {/* 음식 목록 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 분석 결과</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{item.foodName}</h4>
                    <div className="text-sm text-gray-500">
                      {Math.round(item.confidence * 100)}% 신뢰도
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">{item.quantity}</div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600">{item.calories} kcal</div>
                    <div className="text-xs text-gray-500">
                      단백질: {item.nutrients.protein.value}{item.nutrients.protein.unit}
                    </div>
                  </div>

                  {/* 영양성분 상세 */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>탄수화물: {item.nutrients.carbohydrates.value}{item.nutrients.carbohydrates.unit}</div>
                      <div>지방: {item.nutrients.fat.value}{item.nutrients.fat.unit}</div>
                      {item.nutrients.sugars && (
                        <div>당: {item.nutrients.sugars.value}{item.nutrients.sugars.unit}</div>
                      )}
                    </div>
                    {item.nutrients.sodium && (
                      <div className="text-xs text-gray-600 mt-1">
                        나트륨: {item.nutrients.sodium.value}{item.nutrients.sodium.unit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
