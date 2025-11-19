import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Circle } from "lucide-react-native";
import { useRegistration } from "../../context/RegistrationDataContext";
import { uploadImageToFirebase } from "../../utilities/firebaseFunctions";
import { GoogleGenAI } from "@google/genai";

// ⚠️ IMPORTANT: Never hardcode API keys in your app.
// Use environment variables (e.g., via eas.json or .env)
const GEMINI_API_KEY = "AIzaSyAye-_5mBVbKILBxgGPZUX1B4SwnKyXAhg";

const UploadIDCard = () => {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });
  const router = useRouter();
  const { formData, updateFormData } = useRegistration();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Permission Required</Text>
          <Text style={styles.subtitle}>
            We need your permission to use the camera to capture your ID card.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isLoading) return;
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        exif: false,
      });
      setPreviewUri(photo.uri);
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Failed to capture ID photo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setPreviewUri(null);
  };

  const handleConfirm = async () => {
    if (!previewUri) return;
    setIsLoading(true); // Start loading for the entire upload + validation process
    try {
      // 1. Upload the image
      const uploadedImageLink = await uploadImageToFirebase(previewUri);
      console.log("✅ Uploaded ID card:", uploadedImageLink);

      // 2. Validate the image
      const isIDCard = await validateImage(uploadedImageLink);

      if (isIDCard) {
        // 3a. If valid, update data and move to next screen
        updateFormData({
          idCardUploaded: true,
          idCardPhotoURL: uploadedImageLink,
        });
        router.push("UploadVideos"); // Go to the next step
      } else {
        // 3b. If invalid, alert user and force retake
        Alert.alert(
          "Invalid Photo",
          "This does not appear to be an ID card. Please retake the photo."
        );
        handleRetake(); // Go back to camera
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      Alert.alert("Upload Failed", error.message || "Please try again.");
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  const handleSkip = () => {
    updateFormData({ idCardUploaded: false });
    router.push("UploadVideos"); // Ensure this is the correct next screen for skipping
  };

  /**
   * Validates if the uploaded image is an ID card using Gemini.
   * @param {string} imageUrl - The public URL of the uploaded image.
   * @returns {Promise<boolean>} - True if it's an ID card, false otherwise.
   */
  const validateImage = async (imageUrl) => {
    try {
      // 1️⃣ Fetch the image
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();

      // 2️⃣ Convert to Base64
      const base64ImageData = arrayBufferToBase64(arrayBuffer);

      // 3️⃣ Send to Gemini with a specific prompt
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite", // Using a fast model
        contents: [
          {
            inlineData: {
              // The uploader should output jpeg, but png is also common
              mimeType: "image/jpeg",
              data: base64ImageData,
            },
          },
          {
            text: "Is this image a photo of an official identification card, such as a driver's license, passport, Aadhar card, PAN card, or voter ID card? Answer with only the single word 'YES' or 'NO'.",
          },
        ],
      });

      const text = result.text.trim().toUpperCase();
      console.log("Gemini validation result:", text);

      // 4️⃣ Return true only if the answer is exactly "YES"
      return text === "YES";
    } catch (error) {
      console.error("Gemini validation error:", error);
      // Fail-safe: If AI check fails, reject the image.
      Alert.alert(
        "Verification Failed",
        "Could not verify the image. Please try again."
      );
      return false;
    }
  };

  // 🔄 Convert ArrayBuffer → Base64 for RN
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return global.btoa(binary); // RN supports btoa()
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {previewUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#E91E63" }]}
              onPress={handleRetake}
              disabled={isLoading} // Disable retake while confirming
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#4CAF50" }]}
              onPress={handleConfirm}
              disabled={isLoading} // Disable button while loading
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Upload your ID card</Text>
              <Text style={styles.subHeaderText}>
                Align your ID card within the square
              </Text>
            </View>

            {/* 👇 Square overlay */}
            <View style={styles.square} />

            <View style={styles.controls}>
              {isLoading ? ( // Show loading indicator if capture is in progress
                <ActivityIndicator size="large" color="#ffffff" />
              ) : (
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                >
                  <Circle color="#fff" size={60} strokeWidth={3} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: { marginTop: 60, alignItems: "center" },
  headerText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subHeaderText: { fontSize: 16, color: "#fff", marginTop: 10 },
  square: {
    width: "85%", // Made slightly larger for better alignment
    aspectRatio: 1.58, // Aspect ratio for a standard ID card (e.g., CR80)
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#fff",
    borderStyle: "dashed",
    opacity: 0.8,
  },
  controls: {
    marginBottom: 50,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20, // Adjusted for safe area
    right: 20,
    padding: 10,
  },
  skipButtonText: { fontSize: 18, color: "#fff", fontWeight: "500" },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20, // Adjusted for safe area
    left: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  backButtonText: { fontSize: 30, color: "#fff" },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "90%",
    height: undefined,
    aspectRatio: 1.58, // Match the card aspect ratio
    borderRadius: 10,
  },
  previewButtons: {
    flexDirection: "row",
    marginTop: 30,
    width: "80%",
    justifyContent: "space-around", // Use space-around for better spacing
  },
  button: {
    flex: 0.45,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default UploadIDCard;