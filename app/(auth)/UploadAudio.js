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
  refFromURL,
} from "firebase/storage";
import { db, storage } from "../../firebase.config";
import { useAuth } from "../../context/AuthContext";

const questions = [
  "Describe yourself in short ✍🏻",
  "Describe yourself as a partner 👫",
  "What is your partner preference? 👀",
];

const MAX_RECORDING_DURATION = 60 * 1000; // 60 seconds
const MIN_RECORDING_DURATION = 5 * 1000; // 5 seconds

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
  const recordingStartTimeRef = useRef(null);
  const isTryingToRecord = useRef(false);

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
      if (playerStatus?.playing) {
        Alert.alert("Wait", "Stop playback before recording.");
        return;
      }
      isTryingToRecord.current = true;
      await recorder.prepareToRecordAsync();

      if (!isTryingToRecord.current) {
        return;
      }

      recorder.record();
      recordingStartTimeRef.current = Date.now();
      startPulse();
      setTimeout(() => {
        if (recorderState.isRecording) stopRecording();
      }, MAX_RECORDING_DURATION);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not start recording");
      isTryingToRecord.current = false;
    }
  };

  // --- NEW stopRecording FUNCTION ---
  const stopRecording = async () => {
    isTryingToRecord.current = false; // Set intent flag to false

    // Case 1: User tapped *during* prepare. Recording never started.
    if (!recordingStartTimeRef.current) {
      stopPulse();
      return;
    }

    // Case 2: Recording *did* start. Get duration.
    const stopTime = Date.now();
    const duration = stopTime - recordingStartTimeRef.current;
    
    try {
      await recorder.stop(); // This will fail on a "tap"
      stopPulse();
      recordingStartTimeRef.current = null; // Reset ref *after* successful stop

    } catch (err) {
      // --- THIS IS THE FIX ---
      // We *expect* this block to run on a quick tap.
      // The recorder.stop() failed, which is our "too short" signal.
      console.warn("Recorder stop failed, likely due to tap:", err);
      stopPulse();
      recordingStartTimeRef.current = null; // Reset ref
      
      // Show the alert, because we know this was a tap.
      Alert.alert(
        "Recording Too Short",
        `Please hold the button for at least ${
          MIN_RECORDING_DURATION / 1000
        } seconds.`
      );
      return; // Exit
    }

    // --- If stop() SUCCEEDED ---
    // Now we check if the *successful* recording was long enough.
    if (duration < MIN_RECORDING_DURATION) {
      Alert.alert(
        "Recording Too Short",
        `Please hold the button for at least ${
          MIN_RECORDING_DURATION / 1000
        } seconds.`
      );
      return; // Exit without saving
    }

    // If we're here, stop() succeeded AND duration is good.
    const uri = recorder.uri;
    const updatedUris = [...audioUris];
    updatedUris[currentQuestionIndex] = uri;
    setAudioUris(updatedUris);
    setAudioSource(uri);
  };
  // --- END of new stopRecording ---

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
    if (playerStatus?.playing === false) {
      stopPulse();
    }
    if (playerStatus?.playing === true) {
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

  // --- Submission Logic (Unchanged) ---
  const handleRegistrationSubmit = async () => {
    // ... (no changes)
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

  const handleUpdateProfile = async () => {
    // ... (no changes)
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
          const fileExtension = uri.split(".").pop() || "m4a";
          console.log(`Uploading file with extension: .${fileExtension}`);
          const fileRef = ref(
            storage,
            `users/${user.uid}/audio_${index}.${fileExtension}`
          );
          const contentType =
            fileExtension === "mp4" ? "audio/mp4" : "audio/m4a";
          const uploadTask = uploadBytesResumable(fileRef, blob, {
            contentType: contentType,
          });
          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
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
            const deleteRef = refFromURL(storage, originalUrl);
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

  const handleNextOrSubmit = async () => {
    // ... (no changes)
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

  // --- Render (Unchanged) ---
  const currentUri = audioUris[currentQuestionIndex];
  const isRecording = recorderState.isRecording;
  const playing = !!playerStatus?.playing;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isBusy = isUploading || isRecording || playing;

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
        {!currentUri && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={styles.holdButtonWrapper}
            disabled={playing || isUploading || isRecording}
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
                    backgroundColor: playing ? "#2E7D32" : "#43A047",
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

// --- Styles (Unchanged) ---
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