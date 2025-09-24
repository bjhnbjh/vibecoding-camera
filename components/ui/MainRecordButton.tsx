'use client';

import { useState } from 'react';

interface MainRecordButtonProps {
  onImageSelect: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function MainRecordButton({ 
  onImageSelect, 
  isLoading = false, 
  disabled = false 
}: MainRecordButtonProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    if (disabled || isLoading) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 모바일에서 카메라 직접 실행
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImageSelect(file);
      }
    };
    
    input.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center
          text-white font-bold text-xl shadow-2xl transform transition-all duration-300
          border-4 border-transparent
          ${isDragOver ? 'border-emerald-300 border-dashed' : ''}
          ${isLoading || disabled
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 hover:scale-105 active:scale-95 cursor-pointer'
          }
          
          /* 모바일 최적화 */
          sm:w-72 sm:h-72
          md:w-80 md:h-80
          
          /* 터치 피드백 */
          touch-manipulation
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">분석 중...</span>
            <span className="text-xs opacity-75">잠시만 기다려주세요</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <span className="text-4xl sm:text-5xl">📸</span>
            <span className="text-lg sm:text-xl">식단 기록하기</span>
            <span className="text-sm opacity-90">
              {isDragOver ? '이미지를 여기에 놓으세요' : '탭하여 시작'}
            </span>
          </div>
        )}
      </button>
      
      {/* 힌트 텍스트 */}
      <div className="mt-4 text-center text-sm text-gray-600 space-y-1">
        <p>📱 카메라로 촬영하거나 갤러리에서 선택</p>
        <p className="hidden sm:block">💻 데스크톱에서는 드래그&드롭도 가능</p>
      </div>
    </div>
  );
}
