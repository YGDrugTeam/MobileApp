import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. 우리가 Expo용으로 고친 컴포넌트들 임포트
import { MedicLensLogo } from "../components/MedicLensLogo";
import { OnboardingScreen } from "../components/OnboardingScreen";
import { ImageCapture } from "../components/ImageCapture";
import { AnalysisLoader } from "../components/AnalysisLoader";
import { DrugResultCard } from "../components/DrugResultCard";
import { ManualSearch } from "../components/ManualSearch";
import { Button } from "../components/ui/button";

// 2. 아이콘 및 서비스 (Native용)
import { ArrowLeft, Search, Camera, XCircle } from "lucide-react-native";
import { analyzeDrugImage, searchDrug } from "../services/drugService";

/* ===============================
   ✅ 백엔드 연결 확인용 설정
   =============================== */
const API_BASE_URL = "http://172.16.30.167:8000"; // ⚠️ 네 PC 실제 IP로 바꿔야 함

type AppStage =
  | "onboarding"
  | "capture"
  | "analyzing"
  | "result"
  | "error"
  | "manual-search";

type AnalysisStage = "quality" | "ocr" | "matching" | "summarizing";

interface DrugInfo {
  drugId: string;
  drugName: string;
  dosage: string;
  efficacy: string;
  summary: string;
  confidence: number;
}

const Index = () => {
  const [stage, setStage] = useState<AppStage>("onboarding");
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("quality");
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  /* ===============================
     ✅ 앱 시작 시 백엔드 연결 테스트
     =============================== */
  useEffect(() => {
    fetch(`${API_BASE_URL}/ping`)
      .then(res => res.json())
      .then(data => {
        console.log("✅ 백엔드 연결 성공:", data);
      })
      .catch(err => {
        console.error("❌ 백엔드 연결 실패:", err);
      });
  }, []);

  const handleStart = useCallback(() => setStage("capture"), []);

  const handleGoHome = useCallback(() => {
  setDrugInfo(null);
  setErrorMessage("");
  setAnalysisStage("quality");
  setStage("onboarding");
}, []);


  const handleImageCapture = useCallback(async (imageData: string) => {
    setStage("analyzing");
    setAnalysisStage("quality");

    const stages: AnalysisStage[] = ["quality", "ocr", "matching", "summarizing"];
    stages.forEach((s, i) => {
      setTimeout(() => setAnalysisStage(s), i * 1500);
    });

    try {
      const result = await analyzeDrugImage(imageData);
      if (result.success && result.drugInfo) {
        setDrugInfo(result.drugInfo);
        setStage("result");
      } else {
        setErrorMessage(result.error || "분석에 실패했습니다.");
        setStage("error");
      }
    } catch {
      setErrorMessage("분석 중 오류가 발생했습니다.");
      setStage("error");
    }
  }, []);

  const handleManualSearch = useCallback(async (query: string) => {
    setStage("analyzing");
    setAnalysisStage("matching");
    setTimeout(() => setAnalysisStage("summarizing"), 1000);

    try {
      const result = await searchDrug(query);
      if (result.success && result.drugInfo) {
        setDrugInfo(result.drugInfo);
        setStage("result");
      } else {
        setErrorMessage(result.error || "검색에 실패했습니다.");
        setStage("error");
      }
    } catch {
      setErrorMessage("검색 중 오류가 발생했습니다.");
      setStage("error");
    }
  }, []);

  const handleRetry = useCallback(() => {
    setDrugInfo(null);
    setErrorMessage("");
    setStage("capture");
  }, []);

  const handleBack = useCallback(() => {
    if (stage === "manual-search" || stage === "error") setStage("capture");
    else if (stage === "capture") setStage("onboarding");
  }, [stage]);

  if (stage === "onboarding") {
    return <OnboardingScreen onStart={handleStart} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {stage !== "analyzing" && stage !== "result" ? (
          <Button variant="ghost" size="icon" onPress={handleBack}>
            <ArrowLeft color="#0f172a" size={24} />
          </Button>
        ) : <View style={{ width: 40 }} />}
        
        <MedicLensLogo size="sm" showText={false} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {/* 1. 촬영 단계 */}
        {stage === "capture" && (
          <View style={styles.section}>
            <Text style={styles.title}>약 사진 촬영</Text>
            <Text style={styles.subtitle}>알약이 선명하게 보이도록 촬영해주세요</Text>
            <ImageCapture onImageCapture={handleImageCapture} />
            
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.line} />
            </View>

            <Button variant="outline" onPress={() => setStage("manual-search")} style={styles.manualBtn}>
              <Search color="#64748b" size={20} />
              <Text style={styles.manualBtnText}> 약 이름으로 직접 검색</Text>
            </Button>
          </View>
        )}

        {/* 2. 수동 검색 단계 */}
        {stage === "manual-search" && (
          <View style={styles.section}>
            <Text style={styles.title}>약 검색</Text>
            <Text style={styles.subtitle}>약 이름 또는 각인 문자를 입력하세요</Text>
            <ManualSearch onSearch={handleManualSearch} />
            <Button variant="ghost" onPress={() => setStage("capture")} style={{ marginTop: 20 }}>
              <Camera color="#3b82f6" size={20} />
              <Text style={{ color: "#3b82f6" }}> 사진으로 검색하기</Text>
            </Button>
          </View>
        )}

        {/* 3. 분석 중 */}
        {stage === "analyzing" && <AnalysisLoader stage={analysisStage} />}

        {/* 4. 결과 출력 */}
        {stage === "result" && drugInfo && (
          <DrugResultCard drugInfo={drugInfo} onRetry={handleRetry} onGoHome={handleGoHome}/>
        )}

        {/* 5. 에러 화면 */}
        {stage === "error" && (
          <View style={styles.errorContainer}>
            <XCircle color="#ef4444" size={64} />
            <Text style={styles.title}>인식 실패</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <View style={styles.buttonRow}>
              <Button variant="outline" onPress={handleRetry} style={{ flex: 1 }}>
                <Text>재촬영</Text>
              </Button>
              <Button onPress={() => setStage("manual-search")} style={{ flex: 1, backgroundColor: '#3b82f6' }}>
                <Text style={{ color: '#fff' }}>직접 검색</Text>
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  mainContent: { padding: 20, paddingBottom: 100 },
  section: { width: "100%" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center", color: "#64748b", marginBottom: 30 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { marginHorizontal: 10, color: "#94a3b8", fontSize: 12 },
  manualBtn: { height: 56, borderColor: "#e2e8f0" },
  manualBtnText: { fontSize: 16, color: "#475569" },
  errorContainer: { alignItems: "center", paddingVertical: 40 },
  errorText: { color: "#64748b", textAlign: "center", marginBottom: 30 },
  buttonRow: { flexDirection: "row", gap: 12, width: "100%" }
});

export default Index;