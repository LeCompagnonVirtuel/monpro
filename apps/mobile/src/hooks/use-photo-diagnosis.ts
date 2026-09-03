import { useState, useCallback } from 'react';
import { aiApi, DiagnosisResult } from '@/api/ai';

export function usePhotoDiagnosis() {
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnose = useCallback(async (imageUri: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const data = reader.result as string;
          resolve(data.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      const { data: res } = await aiApi.diagnose(base64);
      setResult(res.data);
    } catch {
      setError("Impossible d'analyser la photo. Réessayez.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isAnalyzing, error, diagnose, clearResult };
}
