'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    // 임시 로그인 기능
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleRecordMeal = () => {
    setIsLoading(true);
    // 임시로 2초 후 로딩 완료
    setTimeout(() => {
      setIsLoading(false);
      alert('식단 기록이 완료되었습니다!');
    }, 2000);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 모바일에서 카메라 직접 실행
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleRecordMeal();
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">🍽️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">AI 식단 기록</h1>
        </div>
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">안녕하세요!</span>
            <button
              onClick={handleLogout}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            로그인
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 py-8 sm:py-16">
        {!isLoggedIn ? (
          // 비로그인 상태 - 서비스 소개
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
              onClick={handleLogin}
              className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold text-lg hover:bg-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              지금 시작하기
            </button>
          </div>
        ) : (
          // 로그인 상태 - 메인 기록 버튼
          <div className="max-w-md text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                오늘의 식단을 기록해보세요
              </h2>
              <p className="text-gray-600">
                음식 사진을 찍거나 선택하면 자동으로 분석됩니다
              </p>
            </div>

            {/* 메인 기록 버튼 */}
            <div className="relative">
              <button
                onClick={handleImageUpload}
                disabled={isLoading}
                className={`
                  w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center
                  text-white font-bold text-xl shadow-2xl transform transition-all duration-300
                  ${isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">분석 중...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-4xl">📸</span>
                    <span className="text-lg">식단 기록하기</span>
                    <span className="text-sm opacity-90">탭하여 시작</span>
                  </div>
                )}
              </button>
            </div>

            {/* 최근 기록 미리보기 */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">오늘의 기록</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">아침</span>
                  <span className="text-emerald-600 font-medium">320 kcal</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">점심</span>
                  <span className="text-gray-400">미기록</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">저녁</span>
                  <span className="text-gray-400">미기록</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors">
                전체 기록 보기
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (로그인 시에만 표시) */}
      {isLoggedIn && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around max-w-md mx-auto">
            <button className="flex flex-col items-center py-2 px-4 text-emerald-600">
              <span className="text-xl mb-1">🏠</span>
              <span className="text-xs font-medium">홈</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-gray-400 hover:text-gray-600">
              <span className="text-xl mb-1">📊</span>
              <span className="text-xs">나의 식단</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}