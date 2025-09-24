'use client';

import { useState, useCallback } from 'react';
import { AnalysisResult, AnalysisResponse, AnalysisError } from '@/types/analysis';

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  error: AnalysisError | null;
  analyzeImage: (file: File) => Promise<void>;
  clearResult: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);

  const analyzeImage = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/send-to-webhook', {
        method: 'POST',
        body: formData,
      });

      const result: AnalysisResponse = await response.json();

      console.log('API 응답:', response.status, result);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error?.message || '요청 실패'}`);
      }

      if (!result.success) {
        throw new Error(result.error?.message || '분석에 실패했습니다.');
      }

      if (result.data) {
        setAnalysisResult(result.data);
      } else {
        // 데이터가 없는 경우 빈 결과로 처리
        setAnalysisResult({
          items: [],
          summary: {
            totalCalories: 0,
            totalCarbohydrates: { value: 0, unit: 'g' },
            totalProtein: { value: 0, unit: 'g' },
            totalFat: { value: 0, unit: 'g' }
          }
        });
      }
    } catch (err) {
      console.error('분석 중 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError({
        code: 'ANALYSIS_ERROR',
        message: errorMessage,
        details: err instanceof Error ? err.stack : undefined,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeImage,
    clearResult,
  };
}
