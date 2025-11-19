import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails"; // --- ADDED FOR THUMBNAIL ---
import { Ionicons } from "@expo/vector-icons";

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase.config";
import { useRegistration } from "../../context/RegistrationDataContext";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

const QUESTIONS = [
  "Introduce yourself 👋",
  "What are your favourite movies? 🎬",
  "What are your partner preferences? ❤️",
];

export default function UploadVideos() {
  const router = useRouter();
  const { formData, updateFormData } = useRegistration();
  const { user } = useAuth();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [video, setVideo] = useState(null);
  const [timer, setTimer] = useState(60);
  const [isUploading, setIsUploading] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [videoURLs, setVideoURLs] = useState([]);

  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const player = useVideoPlayer(null);

  useEffect(() => {
    if (video) {
      player.replace(video.uri);
      player.loop = true;
      player.play();
    } else {
      player.pause();
      player.replace(null);
    }
  }, [video]);

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission, micPermission]);

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionText}>
          Please grant camera & mic access
        </Text>
        <TouchableOpacity
          onPress={() => {
            requestCameraPermission();
            requestMicPermission();
          }}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ----------------- START RECORDING -----------------
  const startRecording = async () => {
    if (!cameraRef.current) return;
    setIsRecording(true);
    setTimer(60);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const vid = await cameraRef.current.recordAsync({
        maxDuration: 60,
        quality: "720p",
      });
      setVideo(vid);
    } catch (err) {
      console.log(err);
    }

    setIsRecording(false);
  };

  // ----------------- STOP RECORDING -----------------
  const stopRecording = () => {
    if (isRecording && cameraRef.current) {
      cameraRef.current.stopRecording();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  // ----------------- GENERATE VIDEO THUMBNAIL -----------------
  const generateThumbnail = async (uri) => {
    try {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        uri,
        {
          time: 1000, // 1 sec mark
        }
      );
      return thumbnailUri;
    } catch (e) {
      console.log("Thumbnail generation error:", e);
      return null;
    }
  };

  // -------------- UPLOAD A FILE TO FIREBASE -----------------
  const uploadFile = async (path, fileUri) => {
    const blob = await (await fetch(fileUri)).blob();
    const storageRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(storageRef, blob);

    await new Promise((resolve, reject) => {
      uploadTask.on("state_changed", null, reject, () => resolve());
    });

    return await getDownloadURL(uploadTask.snapshot.ref);
  };

  // ----------------- CONFIRM VIDEO -----------------
  const handleConfirm = async () => {
    if (!video?.uri) return;

    setIsUploading(true);

    try {
      // 1. Generate thumbnail
      const thumbnailUri = await generateThumbnail(video.uri);

      // 2. Upload video
      const videoPath = `users/${user.uid}/video_${Date.now()}.mp4`;
      const videoURL = await uploadFile(videoPath, video.uri);

      // 3. Upload thumbnail image
      let thumbnailURL = null;
      if (thumbnailUri) {
        const thumbPath = `users/${user.uid}/thumb_${Date.now()}.jpg`;
        thumbnailURL = await uploadFile(thumbPath, thumbnailUri);
      }
      console.log("trhumbnaik link " + thumbnailURL);
      // 4. Push object { videoURL, thumbnailURL }
      const entry = { videoURL, thumbnailURL };
      setVideoURLs((prev) => [...prev, entry]);

      // 5. Move to next question
      setVideo(null);
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex((i) => i + 1);
      } else {
        updateFormData({
          ...formData,
          videoURLs: [...videoURLs, entry],
        });

        router.push("/ValidateOTP");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Upload Error", "Video upload failed.");
    }

    setIsUploading(false);
  };

  // -------------------- UI --------------------
  if (video) {
    return (
      <SafeAreaView style={styles.container}>
        <VideoView style={StyleSheet.absoluteFill} player={player} />

        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.btn} onPress={() => setVideo(null)}>
            <Ionicons name="refresh" size={26} color="white" />
            <Text style={styles.btnText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, isUploading && { opacity: 0.3 }]}
            disabled={isUploading}
            onPress={handleConfirm}
          >
            {isUploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={26} color="white" />
                <Text style={styles.btnText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.question}>{QUESTIONS[currentQuestionIndex]}</Text>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="video"
      />

      {isRecording && <Text style={styles.timerText}>{timer}s</Text>}

      <View style={styles.recordControls}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.recordButton}
        >
          <View style={isRecording ? styles.stopInner : styles.circleInner} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1 },
  question: {
    textAlign: "center",
    padding: 20,
    fontSize: 20,
    color: "white",
    fontWeight: "600",
  },
  timerText: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  recordControls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: "white",
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  circleInner: {
    width: 60,
    height: 60,
    backgroundColor: "red",
    borderRadius: 30,
  },
  stopInner: {
    width: 28,
    height: 28,
    backgroundColor: "red",
    borderRadius: 4,
  },
  previewControls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  btn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    flexDirection: "row",
  },
  btnText: { color: "white", marginLeft: 10, fontSize: 16 },
  permissionText: { color: "white", fontSize: 16, marginBottom: 20 },
  permissionButton: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: { color: "black", fontWeight: "bold" },
});
