import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationDataContext";
import { CameraView, useCameraPermissions } from "expo-camera"; // 1. Import Camera
import { Circle, Zap } from "lucide-react-native"; // 2. Import icons

// Mock API call for face validation
// In a real app, you would upload the photo to a service (e.g., AWS Rekognition)
const validateFaceAPI = (photoUri) => {
  return new Promise((resolve, reject) => {
    console.log("Validating face (mock API)...", photoUri.substring(0, 50));
    // Simulate a 2-second API call
    setTimeout(() => {
      // Simulate a successful validation
      const isRealFace = Math.random() > 0.1; // 90% success rate
      if (isRealFace) {
        console.log("Mock API: Face is valid.");
        resolve({ success: true, message: "Face verified" });
      } else {
        console.log("Mock API: Face is not valid.");
        reject(new Error("Face could not be verified. Please try again."));
      }
    }, 2000);
  });
};

const FaceVerification = () => {
  const { formData, updateFormData } = useRegistration();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);

  // Request camera permissions when the screen loads
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted
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

  const handleCapture = async () => {
    if (!cameraRef.current || isLoading) return;

    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Lower quality for faster upload
        exif: false,
      });
      console.log(photo.uri);
      // Call your validation API
      await validateFaceAPI(photo.uri);

      // Success!
      Alert.alert("Success", "Your face has been verified.");
      updateFormData({
        faceVerified: true,
        faceVerificationPhotoURL: photo.uri,
      }); // Save validation
      router.push("UploadIDCard"); // Go to next step
    } catch (error) {
      console.error(error);
      Alert.alert("Verification Failed", error.message || "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    updateFormData({ faceVerified: false });
    router.push("UploadIDCard"); // Skip to next step
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CameraView
        style={styles.camera}
        facing="front" // Use the selfie camera
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          {/* Top instructional text */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Verify your profile</Text>
            <Text style={styles.subHeaderText}>
              Fit your face within the oval
            </Text>
          </View>

          {/* Face Oval */}
          <View style={styles.oval} />

          {/* Bottom Controls */}
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

          {/* Skip Button (top right) */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          {/* Back Button (top left) */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    marginTop: 60,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subHeaderText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
  },
  oval: {
    width: "70%",
    aspectRatio: 3 / 4,
    borderRadius: 200, // Make it oval
    borderWidth: 4,
    borderColor: "#fff",
    borderStyle: "dashed",
    backgroundColor: "transparent",
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 20,
    right: 20,
    padding: 10,
  },
  skipButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
  },
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
  backButtonText: {
    fontSize: 30,
    color: "#fff",
  },
  // Used for the permission denied screen
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#E91E63", // Pink color
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default FaceVerification;
