import { View, Button, Image } from "react-native";
import { useState } from "react";
import { analyzePill } from "../api/pillApi";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!imageUri) return;

    try {
      const data = await analyzePill(imageUri);
      setResult(data);
      console.log(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View>
      {imageUri && <Image source={{ uri: imageUri }} />}
      <Button title="알약 분석" onPress={handleAnalyze} />
    </View>
  );
}
