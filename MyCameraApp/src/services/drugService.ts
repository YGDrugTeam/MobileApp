// src/services/drugService.ts

interface DrugInfo {
  drugId: string;
  drugName: string;
  dosage: string;
  efficacy: string;
  summary: string;
  confidence: number;
}

interface AnalysisResult {
  success: boolean;
  drugInfo?: DrugInfo;
  error?: string;
  confidence?: number;
}

/** ⚠️ FastAPI 서버 주소 (PC 실제 IP) */
const API_BASE_URL = "http://172.16.30.167:8000";

/**
 * 📸 알약 이미지 분석 (FastAPI → Custom Vision → GPT)
 */
export const analyzeDrugImage = async (
  imageData: string
): Promise<AnalysisResult> => {
  try {
    const formData = new FormData();

    // Expo ImagePicker 결과는 보통 base64 or uri
    formData.append("file", {
      uri: imageData,
      name: "pill.jpg",
      type: "image/jpeg",
    } as any);

    const res = await fetch(`${API_BASE_URL}/pill/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("서버 응답 실패");
    }

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        error: data.message || "알약 분석에 실패했습니다.",
      };
    }

    /** 🔥 FastAPI → GPT 결과를 프론트 DrugInfo로 매핑 */
    return {
      success: true,
      drugInfo: {
        drugId: data.pill_tag,
        drugName: data.analysis.pill_name,
        dosage: data.analysis.usage,
        efficacy: data.analysis.appearance?.shape ?? "",
        summary: data.analysis.usage,
        confidence: data.confidence,
      },
    };
  } catch (err) {
    console.error("❌ analyzeDrugImage error:", err);
    return {
      success: false,
      error: "서버와 통신 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 🔍 텍스트 기반 수동 검색 (선택 기능)
 * → 지금은 GPT 직접 호출 or 임시 응답으로 처리 가능
 */
export const searchDrug = async (
  query: string
): Promise<AnalysisResult> => {
  try {
    const res = await fetch(`${API_BASE_URL}/pill/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error("검색 실패");
    }

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        error: data.message || "검색 결과가 없습니다.",
      };
    }

    return {
      success: true,
      drugInfo: data.drugInfo,
    };
  } catch (err) {
    console.error("❌ searchDrug error:", err);
    return {
      success: false,
      error: "검색 중 오류가 발생했습니다.",
    };
  }
};
