import { useState, useCallback } from "react";
import { StructuredIntent, VerifiedLotteryData } from "../types/aiTypes";
import { detectIntentLocally, detectIntentWithGemini } from "../services/intentDetector";
import { queryVerifiedLotteryData } from "../services/verifiedLotteryService";

export function useLotteryQuery() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerifiedLotteryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (query: string): Promise<VerifiedLotteryData> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Detect Intent
      const intent = detectIntentLocally(query) || (await detectIntentWithGemini(query));

      // 2. Query Verified DB
      const result = await queryVerifiedLotteryData(intent);
      setData(result);
      setLoading(false);
      return result;
    } catch (e: any) {
      console.warn("useLotteryQuery error:", e);
      setError(e?.message || "Failed to query lottery database");
      setLoading(false);
      const fallback: VerifiedLotteryData = {
        found: false,
        queryType: "UNKNOWN",
        reason: "API_ERROR",
      };
      setData(fallback);
      return fallback;
    }
  }, []);

  return {
    loading,
    data,
    error,
    executeQuery,
  };
}
