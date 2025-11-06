import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
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
import { Mic, Play, RotateCcw, ArrowRight } from "lucide-react-native";

const questions = [
  "Describe yourself in short ✍🏻",
  "Describe yourself as a partner 👫",
  "What is your partner preference? 👀",
];

const MAX_RECORDING_DURATION = 60 * 1000; // 60 seconds

const UploadAudio = () => {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [audioUris, setAudioUris] = useState(Array(questions.length).fill(null));
  const [isUploading, setIsUploading] = useState(false);
  const { formData, updateFormData } = useRegistration();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [audioSource, setAudioSource] = useState(null);
  const player = useAudioPlayer(audioSource);
  const playerStatus = useAudioPlayerStatus(player);

  // Animated pulse value + ref for the loop animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  React.useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  }, []);

  // Pulse animation control (store loop so we can stop it)
  const startPulse = () => {
    // if already running, don't start another loop
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
        // ignore
      }
      pulseLoopRef.current = null;
    }
    // reset value
    pulseAnim.stopAnimation(() => {
      pulseAnim.setValue(1);
    });
  };

  const startRecording = async () => {
    try {
      // prevent starting recording while playing
      if (playerStatus?.isPlaying) {
        Alert.alert("Wait", "Stop playback before recording.");
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      startPulse();

      // auto-stop after 60s
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

  const playAudio = async (uri) => {
    if (!uri || recorderState.isRecording) return;
    // set source explicitly in case it wasn't set
    setAudioSource(uri);

    // start animation & play
    startPulse();
    try {
      // seek and play defensively
      if (player?.seekTo) player.seekTo(0);
      if (player?.play) await player.play();
    } catch (err) {
      console.error("Playback error:", err);
      stopPulse();
    }
  };

  // Stop pulse when playback ends
  React.useEffect(() => {
    // playerStatus.isPlaying can be true/false/undefined
    if (playerStatus?.isPlaying === false) {
      stopPulse();
    }

    // if playback started, ensure pulse is running
    if (playerStatus?.isPlaying === true) {
      startPulse();
    }
  }, [playerStatus]);

  const reRecord = () => {
    const updatedUris = [...audioUris];
    updatedUris[currentQuestionIndex] = null;
    setAudioUris(updatedUris);
    setAudioSource(null);
    // ensure animation stopped
    stopPulse();
  };

  const handleNext = async () => {
    const currentUri = audioUris[currentQuestionIndex];
    if (!currentUri) {
      Alert.alert("Record your answer", "Please record audio before proceeding.");
      return;
    }

    // stop any pulse and playback before moving on
    stopPulse();
    if (player?.stop) {
      try {
        await player.stop();
      } catch (e) {
        // ignore
      }
    }
    setAudioSource(null);

    if (currentQuestionIndex === questions.length - 1) {
      setIsUploading(true);
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
        console.error(err);
        Alert.alert("Upload Failed", "Please try again.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setCurrentQuestionIndex((idx) => idx + 1);
  };

  const currentUri = audioUris[currentQuestionIndex];
  const isRecording = recorderState.isRecording;
  const isPlaying = !!playerStatus?.isPlaying;

  return (
    <SafeAreaView style={styles.container}>
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
                disabled={isPlaying || isUploading}
              >
                <RotateCcw color="#fff" size={22} />
                <Text style={styles.optionText}>Re-record</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rectButton, { backgroundColor: "#1E88E5" }]}
                onPress={handleNext}
                disabled={isUploading || isPlaying}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ArrowRight color="#fff" size={22} />
                    <Text style={styles.optionText}>Next</Text>
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
  questionText: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 60,
    fontWeight: "600",
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
