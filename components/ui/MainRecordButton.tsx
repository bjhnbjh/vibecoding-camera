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
    <div className="relative w-full max-w-xs mx-auto">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center
          font-bold text-xl text-black
          border-4 border-black
          transform-gpu
          ${isDragOver ? 'border-emerald-400 border-dashed' : ''}
          ${isLoading || disabled
            ? 'bg-slate-300 cursor-not-allowed' 
            : 'bg-gradient-to-br from-emerald-300 to-green-400 neo-button'
          }
          touch-manipulation
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-semibold">분석 중...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-center">
            <span className="text-6xl">🍽️</span>
            <span className="text-xl font-extrabold">식단 기록</span>
          </div>
        )}
      </button>
      
      <div className="mt-8 text-center text-sm text-slate-600 space-y-1">
        <p>버튼을 눌러 사진을 선택하세요</p>
        <p className="hidden sm:block">또는 이미지를 드래그&드롭 하세요</p>
      </div>
    </div>
  );
}
