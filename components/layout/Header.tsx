'use client';

import Link from 'next/link';

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
    <header className="sticky top-0 z-50 bg-white/50 backdrop-blur-lg">
      <div className="flex justify-between items-center p-4 border-b-2 border-black">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center border-2 border-black">
            <span className="text-white font-bold text-xl">🍽️</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800">AI 식단 기록</h1>
        </div>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-2">
            <Link href="/subscribe" className="neo-button bg-purple-400 hover:bg-purple-500 px-3 py-1.5 text-sm">
              ✨ 프리미엄
            </Link>
            <button
              onClick={onLogout}
              className="neo-button bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-sm"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="neo-button bg-emerald-400 hover:bg-emerald-500 px-4 py-2 text-base"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
