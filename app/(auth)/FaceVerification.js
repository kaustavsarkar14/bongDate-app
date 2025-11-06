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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Circle } from "lucide-react-native";
import { uploadImageToFirebase } from "../../utilities/firebaseFunctions";

const FaceVerification = () => {
  const { formData, updateFormData } = useRegistration();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState(null); // 👈 for preview photo
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Permission Required</Text>
          <Text style={styles.subtitle}>
            We need your permission to use the camera for verification.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Take the photo
  const handleCapture = async () => {
    if (!cameraRef.current || isLoading) return;
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        exif: false,
      });
      setPreviewUri(photo.uri); // 👈 show preview instead of uploading immediately
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to take photo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPreviewUri(null);
  };

  // Confirm photo and upload
  const handleConfirm = async () => {
    if (!previewUri) return;
    setIsLoading(true);
    try {
      const uploadedImageLink = await uploadImageToFirebase(previewUri);
      updateFormData({
        faceVerified: true,
        faceVerificationPhotoURL: uploadedImageLink,
      });
      console.log("✅ Uploaded image:", uploadedImageLink);
      router.push("UploadIDCard");
    } catch (error) {
      console.error(error);
      Alert.alert("Upload Failed", error.message || "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    updateFormData({ faceVerified: false });
    router.push("UploadIDCard");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 👇 Show preview if available */}
      {previewUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#E91E63" }]}
              onPress={handleRetake}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#4CAF50" }]}
              onPress={handleConfirm}
              disabled={isLoading}
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
        // 👇 Default camera view
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Verify your profile</Text>
              <Text style={styles.subHeaderText}>
                Fit your face within the oval
              </Text>
            </View>

            <View style={styles.oval} />

            <View style={styles.controls}>
              {isLoading ? (
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
  oval: {
    width: "70%",
    aspectRatio: 3 / 4,
    borderRadius: 200,
    borderWidth: 4,
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
    top: Platform.OS === "ios" ? 10 : 20,
    right: 20,
    padding: 10,
  },
  skipButtonText: { fontSize: 18, color: "#fff", fontWeight: "500" },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 20,
    left: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  backButtonText: { fontSize: 30, color: "#fff" },
  // Preview styles
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "90%",
    height: "70%",
    borderRadius: 10,
  },
  previewButtons: {
    flexDirection: "row",
    marginTop: 30,
    width: "80%",
    justifyContent: "space-between",
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

export default FaceVerification;
