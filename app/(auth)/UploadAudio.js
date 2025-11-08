import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform, // Import Platform
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
import { Mic, Play, RotateCcw, ArrowRight, ChevronLeft } from "lucide-react-native";

// --- PRODUCTION: Import Firebase and Auth ---
import { doc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
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
  const { user, setUser } = useAuth(); // Get user and setUser

  // --- 1. Determine Mode ---
  const isUpdateMode = user && user.audioUrls;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // --- 2. Initialize State from Context ---
  // Store the *original* URLs to detect replacements
  const [originalAudioUrls] = useState(
    user?.audioUrls || formData?.audioUrls || Array(questions.length).fill(null)
  );

  // Initialize UI state from user data (update) or form data (registration)
  const [audioUris, setAudioUris] = useState(() => {
    const source = user?.audioUrls || formData?.audioUrls || Array(questions.length).fill(null);
    return [...source]; // Create a copy
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

  // --- Animation Controls (unchanged) ---
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
      } catch (e) { /* ignore */ }
      pulseLoopRef.current = null;
    }
    pulseAnim.stopAnimation(() => {
      pulseAnim.setValue(1);
    });
  };

  // --- Audio Recording Controls (unchanged) ---
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

  // --- Audio Playback Controls (unchanged) ---
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

  // --- 3. Split Submission Logic ---

  // A. Original logic for NEW REGISTRATION
  const handleRegistrationSubmit = async () => {
    try {
      const uploadedUrls = await Promise.all(
        // Use the generic uploader for registration
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
      setIsUploading(false); // Re-enable button on failure
    }
    // Note: setIsUploading(false) is handled in the main handler's finally block
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
          // This is a new local file. Upload it.
          console.log(`Uploading new audio for slot ${index}...`);
          const response = await fetch(uri);
          const blob = await response.blob();
          
          // Store in a user-specific, deterministic path
          const fileRef = ref(storage, `users/${user.uid}/audio_${index}.m4a`);
          const uploadTask = uploadBytesResumable(fileRef, blob, {
            contentType: "audio/m4a", // Specify content type
          });

          return new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null, // no progress observer
              (error) => reject(error),
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
        } else {
          // This is 'http://' URL or 'null'. Keep it.
          return uri;
        }
      });

      // This is the final array of URLs
      const allFinalURLs = await Promise.all(uploadPromises);

      // --- 2. Delete *replaced* files ---
      // If an original URL exists AND it was replaced (new file:// URI),
      // delete the old file from storage.
      const deletePromises = [];
      originalAudioUrls.forEach((originalUrl, index) => {
        const newUri = audioUris[index];

        // If there WAS a URL, and the new URI is a local file...
        if (originalUrl && newUri && newUri.startsWith("file:")) {
          // ...this is a REPLACEMENT. Delete the old file.
          console.log(`Deleting old audio from slot ${index}:`, originalUrl);
          try {
            const deleteRef = ref(storage, originalUrl); // Get ref from URL
            deletePromises.push(deleteObject(deleteRef));
          } catch (error) {
            // Log and ignore errors (e.g., file not found, bad URL)
            console.warn("Could not create delete ref for:", originalUrl, error);
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
          audioUrls: allFinalURLs, // Overwrite with new audio
        });
      }

      Alert.alert("Profile Updated", "Your audio clips have been saved.");
      router.push("ProfilePage"); // Navigate to profile
    } catch (error) {
      console.error("Profile update failed:", error);
      Alert.alert(
        "Update Failed",
        "There was an error updating your audio. Please try again."
      );
      setIsUploading(false); // Re-enable button on failure
    }
  };

  // --- 4. Main Submit Handler ---
  const handleNextOrSubmit = async () => {
    const currentUri = audioUris[currentQuestionIndex];
    if (!currentUri) {
      Alert.alert("Record your answer", "Please record audio before proceeding.");
      return;
    }

    // Stop playback/pulse before navigating
    stopPulse();
    if (player?.stop) {
      try {
        await player.stop();
      } catch (e) { /* ignore */ }
    }
    setAudioSource(null);

    // Check if this is the last question
    if (currentQuestionIndex === questions.length - 1) {
      setIsUploading(true);
      if (isUpdateMode) {
        await handleUpdateProfile();
      } else {
        await handleRegistrationSubmit();
      }
      setIsUploading(false); // This will be set in finally, but good to have
      return;
    }

    // Not the last question, move to the next one
    setCurrentQuestionIndex((idx) => idx + 1);
  };

  const currentUri = audioUris[currentQuestionIndex];
  const isRecording = recorderState.isRecording;
  const isPlaying = !!playerStatus?.isPlaying;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Disable all interactions if uploading, recording, or playing
  const isBusy = isUploading || isRecording || isPlaying;

  return (
    <SafeAreaView style={styles.container}>
      {/* --- 5. Added Back Button --- */}
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
            {/* Circular play button */}
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

            {/* Controls below */}
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
                    {/* --- 5. Updated Button Text --- */}
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
    top: Platform.OS === "ios" ? 50 : 30, // Adjust for SafeArea
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
    paddingHorizontal: 20, // Ensure text wraps nicely
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