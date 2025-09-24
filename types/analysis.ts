export interface FoodItem {
  foodName: string;
  confidence: number;
  quantity: string;
  calories: number;
  nutrients: {
    carbohydrates: { value: number; unit: string };
    protein: { value: number; unit: string };
    fat: { value: number; unit: string };
    sugars?: { value: number; unit: string };
    sodium?: { value: number; unit: string };
  };
}

export interface AnalysisSummary {
  totalCalories: number;
  totalCarbohydrates: { value: number; unit: string };
  totalProtein: { value: number; unit: string };
  totalFat: { value: number; unit: string };
}

export interface AnalysisResult {
  items: FoodItem[];
  summary: AnalysisSummary;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  message?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface AnalysisError {
  code: string;
  message: string;
  details?: string;
}
