'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import AuthPrompt from '@/components/auth/AuthPrompt';
import MainRecordButton from '@/components/ui/MainRecordButton';
import TodaysSummary from '@/components/dashboard/TodaysSummary';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

// 임시 더미 데이터
const DUMMY_MEALS = [
  { mealType: '아침' as const, calories: 320, isRecorded: true },
  { mealType: '점심' as const, isRecorded: false },
  { mealType: '저녁' as const, isRecorded: false },
  { mealType: '간식' as const, isRecorded: false },
];

export default function HomePage() {
  // 로그인 bypass를 위한 상태 (실제 인증은 나중에 구현)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName] = useState('테스트 사용자');
  
  // Toast 훅 사용
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  // 로그인 처리 (bypass)
  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    showInfo('로그인되었습니다. 이제 식단을 기록해보세요!');
  }, [showInfo]);

  // 로그아웃 처리
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  // 이미지 업로드 및 분석 처리
  const handleImageSelect = useCallback(async (file: File) => {
    console.log('선택된 파일:', file.name, file.size, file.type);
    
    setIsLoading(true);
    
    try {
      // TODO: 실제 n8n 웹훅으로 이미지 전송
      // const formData = new FormData();
      // formData.append('image', file);
      // formData.append('userId', 'current-user-id');
      
      // const response = await fetch('/api/analyze-food', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      // 임시로 2초 후 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공 알림
      showSuccess('식단 기록이 완료되었습니다! 총 1,040 kcal가 기록되었습니다.', 4000);
      
    } catch (error) {
      console.error('식단 분석 중 오류:', error);
      showError('식단 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [showSuccess, showError]);

  // 전체 기록 보기
  const handleViewAllRecords = useCallback(() => {
    // TODO: 대시보드 페이지로 이동
    showInfo('대시보드 페이지는 준비 중입니다.');
  }, [showInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* 헤더 */}
      <Header
        isAuthenticated={isAuthenticated}
        userName={userName}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* 메인 콘텐츠 */}
      <main className="flex flex-col items-center justify-center px-4 py-8 sm:py-16 pb-20">
        {!isAuthenticated ? (
          // 비로그인 상태 - 서비스 소개
          <AuthPrompt onLogin={handleLogin} />
        ) : (
          // 로그인 상태 - 메인 기록 버튼과 요약
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
            <MainRecordButton
              onImageSelect={handleImageSelect}
              isLoading={isLoading}
              disabled={false}
            />

            {/* 오늘의 기록 요약 */}
            <TodaysSummary
              meals={DUMMY_MEALS}
              totalCalories={320}
              onViewAll={handleViewAllRecords}
            />
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation isVisible={isAuthenticated} />

      {/* Toast 알림 */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}