'use client';

interface MealRecord {
  mealType: '아침' | '점심' | '저녁' | '간식';
  calories?: number;
  isRecorded: boolean;
}

interface TodaysSummaryProps {
  meals: MealRecord[];
  totalCalories: number;
  onViewAll?: () => void;
}

export default function TodaysSummary({ 
  meals, 
  totalCalories, 
  onViewAll 
}: TodaysSummaryProps) {
  const mealTypeLabels = {
    '아침': '🌅',
    '점심': '☀️',
    '저녁': '🌙',
    '간식': '🍪'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">오늘의 기록</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">{totalCalories}</div>
          <div className="text-xs text-gray-500">총 칼로리</div>
        </div>
      </div>
      
      <div className="space-y-3">
        {meals.map((meal) => (
          <div key={meal.mealType} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{mealTypeLabels[meal.mealType]}</span>
              <span className="text-gray-600">{meal.mealType}</span>
            </div>
            <span className={`font-medium ${meal.isRecorded ? 'text-emerald-600' : 'text-gray-400'}`}>
              {meal.isRecorded ? `${meal.calories} kcal` : '미기록'}
            </span>
          </div>
        ))}
      </div>
      
      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="w-full mt-4 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors"
        >
          전체 기록 보기
        </button>
      )}
    </div>
  );
}
