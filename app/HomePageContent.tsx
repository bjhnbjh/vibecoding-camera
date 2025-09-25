'use client';

import React, { useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import AuthPrompt from '@/components/auth/AuthPrompt';
import MainRecordButton from '@/components/ui/MainRecordButton';
import Toast from '@/components/ui/Toast';
import AnalysisResult from '@/components/ui/AnalysisResult';
import { useToast } from '@/hooks/useToast';
import { useAnalysis } from '@/hooks/useAnalysis';
import type { User } from '@supabase/supabase-js';

interface HomePageContentProps {
  initialUser: User | null;
}

export default function HomePageContent({ initialUser }: HomePageContentProps) {
  const [user, setUser] = useState<User | null>(initialUser);

  // Toast 훅 사용
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // 분석 훅 사용
  const { isAnalyzing, analysisResult, error, analyzeImage, clearResult } = useAnalysis();

  // 에러 발생 시 Toast 메시지 표시
  React.useEffect(() => {
    if (error) {
      showError(`분석 중 오류가 발생했습니다: ${error.message}`);
    }
  }, [error, showError]);

  // 로그인 처리 (현재는 미들웨어에서 처리됨)
  const handleLogin = useCallback(() => {
    window.location.href = '/auth/login';
  }, []);

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      console.log('Starting logout process...')

      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Logout response status:', response.status)

      if (response.ok) {
        const data = await response.json();
        console.log('Logout response:', data)

        // 사용자 상태를 null로 설정하여 즉시 UI 업데이트
        setUser(null);

        // 브라우저 스토리지 정리
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.log('Storage cleanup error:', e);
        }

        console.log('Client-side cleanup completed')

        // 성공 메시지 표시 후 새로고침
        showSuccess(data.message || '로그아웃되었습니다.');

        // 간단한 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } else {
        // 응답이 JSON이 아닐 경우 텍스트로 처리
        try {
          const data = await response.json();
          console.error('Logout failed:', data);
          showError(data.error || '로그아웃 중 오류가 발생했습니다.');
        } catch {
          const text = await response.text();
          console.error('Logout failed with non-JSON response:', text);
          showError('로그아웃 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      showError('로그아웃 중 오류가 발생했습니다.');
    }
  }, [showError, showSuccess]);

  // 이미지 업로드 및 분석 처리
  const handleImageSelect = useCallback(async (file: File) => {
    console.log('선택된 파일:', file.name, file.size, file.type);

    try {
      await analyzeImage(file);

      // 분석 결과가 있는 경우 성공 메시지 표시
      if (analysisResult) {
        showSuccess('이미지 분석이 완료되었습니다!', 4000);
      }
    } catch (error) {
      console.error('이미지 분석 중 오류:', error);
      // 에러 처리는 useAnalysis 훅에서 이미 처리됨
    }
  }, [analyzeImage, analysisResult, showSuccess]);

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <Header
        isAuthenticated={isAuthenticated}
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
          <div className="w-full max-w-lg text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              오늘 무엇을 드셨나요?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              음식 사진을 선택하시면 AI가 자동으로 분석하고 기록해 드립니다.
            </p>

            {/* 메인 기록 버튼 */}
            <div className="mt-10">
              <MainRecordButton
                onImageSelect={handleImageSelect}
                isLoading={isAnalyzing}
                disabled={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation isVisible={isAuthenticated} />

      {/* 분석 결과 모달 */}
      {analysisResult && (
        <AnalysisResult
          result={analysisResult}
          onClose={clearResult}
        />
      )}

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
