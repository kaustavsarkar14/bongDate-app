import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadAudioToFirebase } from "../../utilities/firebaseFunctions";
import { useRegistration } from "../../context/RegistrationDataContext";
import { useRouter } from "expo-router";
import {
  Mic,
  Play,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
} from "lucide-react-native";

// --- PRODUCTION: Import Firebase and Auth ---
import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  refFromURL, // 👈 *** FIX 2: IMPORT refFromURL ***
} from "firebase/storage";
import { db, storage } from "../../firebase.config";
import { useAuth } from "../../context/AuthContext";

const questions = [
  "Describe yourself in short ✍🏻",
  "Describe yourself as a partner 👫",
  "What is your partner preference? 👀",
];

const MAX_RECORDING_DURATION = 60 * 1000; // 60 seconds

const UploadAudio = () => {
  const router = useRouter();
  const { formData, updateFormData } = useRegistration();
  const { user, setUser } = useAuth();
  const isUpdateMode = user && user.audioUrls;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [originalAudioUrls] = useState(
    user?.audioUrls || formData?.audioUrls || Array(questions.length).fill(null)
  );
  const [audioUris, setAudioUris] = useState(() => {
    const source =
      user?.audioUrls ||
      formData?.audioUrls ||
      Array(questions.length).fill(null);
    return [...source];
  });

  // --- Audio Player/Recorder State ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [audioSource, setAudioSource] = useState(null);
  const player = useAudioPlayer(audioSource);
  const playerStatus = useAudioPlayerStatus(player);

  // --- Animation State ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  }, []);

  // --- Animation Controls ---
  const startPulse = () => {
    if (pulseLoopRef.current) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();
  };

  const stopPulse = () => {
    if (pulseLoopRef.current) {
      try {
        pulseLoopRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      pulseLoopRef.current = null;
    }
    pulseAnim.stopAnimation(() => {
      pulseAnim.setValue(1);
    });
  };

  // --- Audio Recording Controls ---
  const startRecording = async () => {
    try {
      if (playerStatus?.isPlaying) {
        Alert.alert("Wait", "Stop playback before recording.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      startPulse();
      setTimeout(() => {
        if (recorderState.isRecording) stopRecording();
      }, MAX_RECORDING_DURATION);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not start recording");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      stopPulse();
      const uri = recorder.uri;
      const updatedUris = [...audioUris];
      updatedUris[currentQuestionIndex] = uri;
      setAudioUris(updatedUris);
      setAudioSource(uri);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not stop recording");
    }
  };

  // --- Audio Playback Controls ---
  const playAudio = async (uri) => {
    if (!uri || recorderState.isRecording) return;
    setAudioSource(uri);
    startPulse();
    try {
      if (player?.seekTo) player.seekTo(0);
      if (player?.play) await player.play();
    } catch (err) {
      console.error("Playback error:", err);
      stopPulse();
    }
  };

  useEffect(() => {
    if (playerStatus?.isPlaying === false) {
      stopPulse();
    }
    if (playerStatus?.isPlaying === true) {
      startPulse();
    }
  }, [playerStatus]);

  const reRecord = () => {
    const updatedUris = [...audioUris];
    updatedUris[currentQuestionIndex] = null;
    setAudioUris(updatedUris);
    setAudioSource(null);
    stopPulse();
  };

  // --- Submission Logic ---

  // A. Original logic for NEW REGISTRATION
  const handleRegistrationSubmit = async () => {
    try {
      const uploadedUrls = await Promise.all(
        audioUris.map((uri) => uploadAudioToFirebase(uri))
      );
      updateFormData({
        ...formData,
        audioUrls: uploadedUrls,
      });
      router.push("/ValidateOTP");
    } catch (err) {
      console.error("Registration upload failed:", err);
      Alert.alert(
        "Upload Failed",
        "There was an error uploading your audio. Please try again."
      );
      setIsUploading(false);
    }
  };

  // B. New, complete logic for UPDATING A PROFILE
  const handleUpdateProfile = async () => {
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }

    try {
      // --- 1. Upload new files ---
      const uploadPromises = audioUris.map(async (uri, index) => {
        if (uri && uri.startsWith("file:")) {
          console.log(`Uploading new audio for slot ${index}...`);
          const response = await fetch(uri);
          const blob = await response.blob();

          // --- FIX 1: DYNAMIC FILE EXTENSION & CONTENT-TYPE ---
          // Get the actual file extension from the URI
          const fileExtension = uri.split(".").pop() || "m4a"; // Fallback to m4a
          console.log(`Uploading file with extension: .${fileExtension}`);

          // Use the dynamic extension in the file path
          const fileRef = ref(
            storage,
            `users/${user.uid}/audio_${index}.${fileExtension}`
          );

          // The MIME type for both .m4a and .mp4 (common with expo-audio) is 'audio/mp4'
          const contentType = fileExtension === "mp4" ? "audio/mp4" : "audio/m4a";

          const uploadTask = uploadBytesResumable(fileRef, blob, {
            contentType: contentType, // Use the determined content type
          });

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null, // no progress observer
              (error) => reject(error),
              async () => {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                resolve(downloadURL);
              }
            );
          });
        } else {
          return uri;
        }
      });

      const allFinalURLs = await Promise.all(uploadPromises);

      // --- 2. Delete *replaced* files ---
      const deletePromises = [];
      originalAudioUrls.forEach((originalUrl, index) => {
        const newUri = audioUris[index];

        if (originalUrl && newUri && newUri.startsWith("file:")) {
          console.log(`Deleting old audio from slot ${index}:`, originalUrl);
          try {
            // --- FIX 2: CORRECTLY GET REFERENCE FROM URL FOR DELETION ---
            const deleteRef = refFromURL(storage, originalUrl); // Use refFromURL
            deletePromises.push(deleteObject(deleteRef));
          } catch (error) {
            console.warn(
              "Could not create delete ref for:",
              originalUrl,
              error
            );
          }
        }
      });

      await Promise.all(deletePromises);

      // --- 3. Update Firestore Document ---
      console.log("Updating user profile with new audio URLs:", allFinalURLs);
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        audioUrls: allFinalURLs,
      });

      // --- 4. Update local AuthContext user state ---
      if (setUser) {
        setUser({
          ...user,
          audioUrls: allFinalURLs,
        });
      }

      Alert.alert("Profile Updated", "Your audio clips have been saved.");
      router.push("ProfilePage");
    } catch (error) {
      console.error("Profile update failed:", error);
      Alert.alert(
        "Update Failed",
        "There was an error updating your audio. Please try again."
      );
      setIsUploading(false);
    }
  };

  // --- Main Submit Handler ---
  const handleNextOrSubmit = async () => {
    const currentUri = audioUris[currentQuestionIndex];
    if (!currentUri) {
      Alert.alert(
        "Record your answer",
        "Please record audio before proceeding."
      );
      return;
    }

    stopPulse();
    if (player?.stop) {
      try {
        await player.stop();
      } catch (e) {
        /* ignore */
      }
    }
    setAudioSource(null);

    if (currentQuestionIndex === questions.length - 1) {
      setIsUploading(true);
      if (isUpdateMode) {
        await handleUpdateProfile();
      } else {
        await handleRegistrationSubmit();
      }
      setIsUploading(false);
      return;
    }

    setCurrentQuestionIndex((idx) => idx + 1);
  };

  const currentUri = audioUris[currentQuestionIndex];
  const isRecording = recorderState.isRecording;
  const isPlaying = !!playerStatus?.isPlaying;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isBusy = isUploading || isRecording || isPlaying;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={isBusy}
      >
        <ChevronLeft color="#fff" size={30} strokeWidth={3} />
      </TouchableOpacity>

      <Text style={styles.questionText}>{questions[currentQuestionIndex]}</Text>

      <View style={styles.centerContent}>
        {/* --- Record State --- */}
        {!currentUri && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={styles.holdButtonWrapper}
            disabled={isPlaying || isUploading || isRecording}
          >
            <Text style={styles.holdText}>
              {isRecording ? "Recording..." : "Hold to Record"}
            </Text>
            <View style={{ height: 40 }} />
            <Animated.View
              style={[
                styles.circleButton,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: isRecording ? "#FF1744" : "#2196F3",
                },
              ]}
            >
              <Mic color="#fff" size={38} />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* --- Preview State --- */}
        {currentUri && !isRecording && (
          <View style={styles.previewContainer}>
            <TouchableOpacity
              onPress={() => playAudio(currentUri)}
              disabled={isRecording || isUploading}
            >
              <Animated.View
                style={[
                  styles.circleButton,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isPlaying ? "#2E7D32" : "#43A047",
                  },
                ]}
              >
                <Play color="#fff" size={38} />
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.rectButton, { backgroundColor: "#e53935" }]}
                onPress={reRecord}
                disabled={isBusy}
              >
                <RotateCcw color="#fff" size={22} />
                <Text style={styles.optionText}>Re-record</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rectButton, { backgroundColor: "#1E88E5" }]}
                onPress={handleNextOrSubmit}
                disabled={isBusy}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ArrowRight color="#fff" size={22} />
                    <Text style={styles.optionText}>
                      {isLastQuestion
                        ? isUpdateMode
                          ? "Save"
                          : "Finish"
                        : "Next"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default UploadAudio;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  questionText: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 60,
    fontWeight: "600",
    paddingHorizontal: 20,
  },
  centerContent: {
    alignItems: "center",
  },
  holdButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  holdText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 25,
  },
  circleButton: {
    width: 100,
    height: 100,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    alignItems: "center",
  },
  previewActions: {
    flexDirection: "row",
    gap: 25,
    marginTop: 40,
  },
  rectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  optionText: {
    color: "#fff",
    fontWeight: "600",
  },
});