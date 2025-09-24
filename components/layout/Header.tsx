'use client';

interface HeaderProps {
  isAuthenticated: boolean;
  userName?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function Header({ 
  isAuthenticated, 
  userName, 
  onLogin, 
  onLogout 
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">🍽️</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">AI 식단 기록</h1>
      </div>
      
      {isAuthenticated ? (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 hidden sm:inline">
            안녕하세요{userName ? `, ${userName}님` : ''}!
          </span>
          <button
            onClick={onLogout}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors px-3 py-1 rounded-md hover:bg-emerald-50"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-sm"
        >
          로그인
        </button>
      )}
    </header>
  );
}
