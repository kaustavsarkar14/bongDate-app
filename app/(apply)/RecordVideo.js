import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  ActivityIndicator, // --- MODIFICATION 1: Import ActivityIndicator ---
  Animated, // --- MODIFICATION 2: Import Animated for text pulse ---
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// --- MODIFICATION 3: Import Firebase storage functions directly ---
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../firebase.config";
import { saveApplicationToFirestore } from "../../utilities/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function RecordVideo() {
  const { user } = useAuth();
  const router = useRouter();
  // --- Permissions ---
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  const [video, setVideo] = useState(null);
  const [timer, setTimer] = useState(60);
  const [isUploading, setIsUploading] = useState(false);
  // --- MODIFICATION 4: Remove uploadProgress state, keep uploadError ---
  // const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // --- Refs ---
  const cameraRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const uploadTaskRef = useRef(null);
  const unsubscribeUploadRef = useRef(null);
  // --- MODIFICATION 5: Add Animated value for pulsating text ---
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // --- Player ---
  const player = useVideoPlayer(null);

  // --- Player State Management ---
  useEffect(() => {
    if (video) {
      player.replace(video.uri);
      player.loop = true;
      player.play();
    } else {
      player.pause();
      player.replace(null);
    }
  }, [video, player]);

  // --- Permission Request ---
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!micPermission?.granted) {
      requestMicPermission();
    }
  }, [cameraPermission, micPermission]);

  // --- Timer Logic ---
  useEffect(() => {
    if (isRecording) {
      setTimer(60);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // --- MODIFICATION 6: Add pulse animation effect ---
  useEffect(() => {
    if (isUploading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0); // Reset animation when not uploading
      pulseAnim.stopAnimation();
    }
  }, [isUploading, pulseAnim]);

  // --- Component cleanup effect ---
  useEffect(() => {
    return () => {
      if (unsubscribeUploadRef.current) {
        console.log("Unmounting: Unsubscribing from upload listener.");
        unsubscribeUploadRef.current();
      }
      if (uploadTaskRef.current) {
        console.log("Unmounting: Cancelling in-progress upload.");
        uploadTaskRef.current.cancel();
      }
    };
  }, []);

  // --- Permission Handling ---
  if (!cameraPermission || !micPermission) {
    return <View />;
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera and record audio.
        </Text>
        <Button
          title="Grant Permissions"
          onPress={() => {
            requestCameraPermission();
            requestMicPermission();
          }}
        />
      </SafeAreaView>
    );
  }

  // --- Recording Functions ---
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    setIsRecording(true);
    try {
      const videoResult = await cameraRef.current.recordAsync({
        maxDuration: 60,
      });
      setVideo(videoResult);
    } catch (e) {
      console.error("Recording failed:", e);
      Alert.alert(
        "Recording Failed",
        "Could not start or complete the recording."
      );
      setIsRecording(false);
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  // --- Preview Handlers ---
  const handleRetake = () => {
    if (isUploading) {
      if (unsubscribeUploadRef.current) {
        unsubscribeUploadRef.current();
      }
      if (uploadTaskRef.current) {
        uploadTaskRef.current.cancel();
        console.log("Upload cancelled by user (Retake).");
      }
    }

    setVideo(null);
    setIsUploading(false);
    // --- MODIFICATION 7: Remove setUploadProgress(0) ---
    // setUploadProgress(0);
    setUploadError(null);
    uploadTaskRef.current = null;
    unsubscribeUploadRef.current = null;
  };

  const handleConfirm = async () => {
    if (isUploading || !video?.uri) return;

    setIsUploading(true);
    // --- MODIFICATION 8: Remove setUploadProgress(0) ---
    // setUploadProgress(0);
    setUploadError(null);

    try {
      const blob = await (await fetch(video.uri)).blob();
      const fileExtension = blob.type.split("/")[1];
      const filename = `videos/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, filename);

      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTaskRef.current = uploadTask;

      unsubscribeUploadRef.current = uploadTask.on(
        "state_changed",
        (snapshot) => {
          // --- MODIFICATION 9: We don't use the progress here anymore ---
          // const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          // setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload task error:", error);
          setUploadError("Upload failed. Please try again.");
          setIsUploading(false);
          uploadTaskRef.current = null;
          unsubscribeUploadRef.current = null;
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("✅ Video Uploaded Successfully! URL:", downloadURL);
            await saveApplicationToFirestore(user.uid, user.name, downloadURL);
            router.replace("ApplySuccess");

            setVideo(null); // Reset to camera screen
          } catch (e) {
            console.error("Error getting download URL:", e);
            setUploadError("Upload failed. Please try again.");
          } finally {
            setIsUploading(false);
            // --- MODIFICATION 10: Remove setUploadProgress(0) ---
            // setUploadProgress(0);
            uploadTaskRef.current = null;
            unsubscribeUploadRef.current = null;
          }
        }
      );
    } catch (e) {
      console.error("Error creating blob or starting upload:", e);
      setUploadError("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  // --- UI Rendering ---
  if (video) {
    const interpolatedColor = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0.7)", "rgba(255,255,255,1)"],
    });

    return (
      <SafeAreaView style={styles.container}>
        <VideoView style={StyleSheet.absoluteFill} player={player} />

        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Animated.Text
              style={[
                styles.loadingText,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1], // Fade between 70% and 100% opacity
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05], // Scale text slightly
                      }),
                    },
                  ],
                  color: interpolatedColor, // Apply color interpolation
                },
              ]}
            >
              Uploading...
            </Animated.Text>
            {/* --- MODIFICATION 11: Remove progress bar UI --- */}
            {/* <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBarFill, { width: `${uploadProgress * 100}%` }]}
              />
            </View> */}
          </View>
        )}

        <View style={styles.previewControls}>
          {uploadError && !isUploading && (
            <Text style={styles.errorText}>{uploadError}</Text>
          )}

          <TouchableOpacity onPress={handleRetake} style={styles.previewButton}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.previewButtonText}>
              {isUploading ? "Cancel" : "Retake"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.previewButton, isUploading && styles.disabledButton]}
            disabled={isUploading}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.previewButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="video"
      />

      {isRecording && <Text style={styles.timerText}>{timer}</Text>}

      <View style={styles.recordButtonContainer}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.recordButton}
        >
          <View
            style={
              isRecording ? styles.stopButtonInner : styles.recordButtonInner
            }
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    color: "white",
    textAlign: "center",
    margin: 20,
    fontSize: 16,
  },
  recordButtonContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "red",
  },
  stopButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: "red",
  },
  timerText: {
    position: "absolute",
    top: 60,
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  previewControls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 10,
  },
  previewButtonText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    position: "absolute",
    top: -40,
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 5,
  },
});
