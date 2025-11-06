import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { useAudioPlayer } from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadAudioToFirebase } from "../../utilities/firebaseFunctions";
import { useRegistration } from "../../context/RegistrationDataContext";
import { useRouter } from "expo-router";

const questions = [
  "Describe yourself in short",
  "Describe yourself as a partner",
  "What is your partner preference?",
];

const MAX_RECORDING_DURATION = 60 * 1000; // 60 seconds

const UploadAudio = () => {
    const route = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [audioUris, setAudioUris] = useState(
    Array(questions.length).fill(null)
  );
  const [isUploading, setIsUploading] = useState(false);
  const { formData, updateFormData } = useRegistration();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [audioSource, setAudioSource] = useState(null);
  const player = useAudioPlayer(audioSource);

  // Setup audio mode once
  React.useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  }, []);

  const startRecording = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();

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
    if (!uri) return;
    player.seekTo(0);
    player.play();
  };

  const handleNext = async () => {
    const currentUri = audioUris[currentQuestionIndex];

    if (!currentUri) {
      Alert.alert(
        "Record your answer",
        "Please record audio before proceeding."
      );
      return;
    }

    if (currentQuestionIndex === questions.length - 1) {
      setIsUploading(true);
      try {
        // Upload all audios at once
        const uploadedUrls = await Promise.all(
          audioUris.map(async (uri) => {
            const firebaseAudioURL = await uploadAudioToFirebase(uri);
            return firebaseAudioURL;
          })
        );

        console.log("✅ All uploaded audio URLs:", uploadedUrls);

        // You can optionally replace local URIs with Firebase URLs
        setAudioUris(uploadedUrls);

        setCurrentQuestionIndex(currentQuestionIndex + 1);

        updateFormData({
          ...formData,
          audioUrls: uploadedUrls,
        });

        // Navigate to next page
        route.push("/ValidateOTP");
      } catch (err) {
        console.error(err);
        Alert.alert("Upload Failed", "Please try again.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Move to next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setAudioSource(audioUris[currentQuestionIndex + 1]);
  };

  // Congrats page
  if (currentQuestionIndex >= questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.congratsText}>
          🎉 Congrats! Your intro is ready.
        </Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => console.log("Audio URLs:", audioUris)}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.questionText}>{questions[currentQuestionIndex]}</Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            recorderState.isRecording && { backgroundColor: "red" },
          ]}
          onPress={recorderState.isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {recorderState.isRecording
              ? "Stop"
              : audioUris[currentQuestionIndex]
              ? "Re-record"
              : "Record"}
          </Text>
        </TouchableOpacity>

        {audioUris[currentQuestionIndex] && !recorderState.isRecording && (
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => playAudio(audioUris[currentQuestionIndex])}
          >
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
        )}

        {recorderState.isRecording && (
          <ActivityIndicator size="large" color="#FF0000" />
        )}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  questionText: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
  },
  controls: { alignItems: "center", marginBottom: 50 },
  recordButton: {
    padding: 20,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    marginBottom: 20,
  },
  recordButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  playButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#FF9800",
    marginTop: 10,
  },
  playButtonText: { color: "#fff", fontSize: 16 },
  nextButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    width: "60%",
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
});

export default UploadAudio;
