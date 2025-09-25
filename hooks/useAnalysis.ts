'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnalysisResult, AnalysisError } from '@/types/analysis';

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  error: AnalysisError | null;
  analyzeImage: (file: File) => Promise<void>;
  clearResult: () => void;
}

const POLLING_INTERVAL = 2500; // 2.5초
const POLLING_TIMEOUT = 60000; // 60초

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);

  // Polling 로직
  useEffect(() => {
    if (!currentAnalysisId || !isAnalyzing) return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/analysis/${currentAnalysisId}`);
        if (!response.ok) return; // 아직 결과가 없으면 그냥 넘어감

        const result = await response.json();
        if (result.success && result.data) {
          if (result.data.status === 'complete') {
            // PRD에 명시된 data.summary, data.items 구조를 사용
            const finalResult = result.data.analysis_result?.data || result.data.analysis_result;
            setAnalysisResult(finalResult);
            setIsAnalyzing(false);
            setCurrentAnalysisId(null);
          } else if (result.data.status === 'failed') {
            throw new Error('AI 분석에 실패했습니다.');
          }
          // 'processing' 상태이면 아무것도 하지 않음
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '결과 조회 중 알 수 없는 오류 발생';
        setError({ code: 'POLLING_ERROR', message: errorMessage });
        setIsAnalyzing(false);
        setCurrentAnalysisId(null);
      }
    };

    const intervalId = setInterval(poll, POLLING_INTERVAL);

    const timeoutId = setTimeout(() => {
      setError({ code: 'TIMEOUT_ERROR', message: '분석 시간이 초과되었습니다.' });
      setIsAnalyzing(false);
      setCurrentAnalysisId(null);
    }, POLLING_TIMEOUT);

    // Cleanup 함수
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };

  }, [currentAnalysisId, isAnalyzing]);

  const analyzeImage = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentAnalysisId(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/send-to-webhook', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '분석 요청에 실패했습니다.');
      }

      // 폴링을 시작하기 위해 analysisId 설정
      setCurrentAnalysisId(result.analysisId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError({ code: 'ANALYSIS_ERROR', message: errorMessage });
      setIsAnalyzing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setCurrentAnalysisId(null);
    setIsAnalyzing(false);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeImage,
    clearResult,
  };
}
