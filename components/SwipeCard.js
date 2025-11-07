import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { User, RotateCcw } from "lucide-react-native";
import { calculateAge } from "../utilities/functions";
import AudioIndicator from "./AudioIndicator";

// Helper function for safe capitalization
const capitalize = (s) => {
  if (typeof s !== "string" || !s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const SwipeCard = ({ user, replayAudio, status }) => {
  // Default loading state to true until status confirms
  const [loading, setLoading] = useState(!status.isLoaded);

  // Memoize derived user data for performance
  const { age, displayName, displayGender, displayReligion } = useMemo(() => {
    return {
      age: calculateAge(user.birthdate),
      displayName: (user.name || "").trim(), // Handle null/undefined names
      displayGender: capitalize(user.gender), // Safely capitalize
      displayReligion: capitalize(user.religion), // Safely capitalize
    };
  }, [user.birthdate, user.name, user.gender, user.religion]);

  // Effect to manage loading state based on audio status
  useEffect(() => {
    // Show loading if the audio is buffering OR if it's not loaded yet
    if (status.isBuffering || !status.isLoaded) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [status.isLoaded, status.isBuffering]);

  // Renders the content inside the button based on state
  const renderButtonContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.audioText}>Loading...</Text>
        </>
      );
    }

    if (status.playing) {
      // Per your original logic, show "Playing..." when active
      return <Text style={styles.audioText}>Playing...</Text>;
    }

    // Default "Replay" state
    return (
      <>
        <RotateCcw size={18} color="#fff" />
        <Text style={styles.audioText}>Replay</Text>
      </>
    );
  };

  return (
    <View style={styles.card}>
      {/* Name */}
      <Text style={styles.name}>{displayName}</Text>

      {/* Gender, Age, Religion */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <User size={18} color="#222" />
          <Text style={styles.infoText}>{displayGender}</Text>
        </View>

        <View style={styles.dot} />
        <Text style={styles.infoText}>{age} yrs</Text>

        <View style={styles.dot} />
        <Text style={styles.infoText}>{displayReligion}</Text>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.hobbyContainer}>
          {/* Use optional chaining for safety */}
          {user.interests?.map((item, index) => (
            <View key={index} style={styles.hobbyChip}>
              <Text style={styles.hobbyText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Audio UI */}
      <AudioIndicator isPlaying={!loading && status.playing} />

      {/* Updated Audio Button */}
      <TouchableOpacity
        style={[
          styles.audioButton,
          (loading || status.playing) && styles.audioButtonDisabled, // Add disabled style
        ]}
        onPress={replayAudio}
        // Disable button while loading OR playing
        disabled={loading || status.playing}
      >
        {renderButtonContent()}
      </TouchableOpacity>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  card: {
    height: 400,
    borderRadius: 50,
    justifyContent: "center",
    backgroundColor: "#ffa8d8ff",
    padding: 20,
    elevation: 5,
  },
  name: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "800",
    color: "#222",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#222",
    marginHorizontal: 4,
    fontWeight: "500",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#333",
    marginHorizontal: 6,
  },
  section: {
    alignItems: "center",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },
  hobbyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  hobbyChip: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  hobbyText: {
    color: "#222",
    fontSize: 14,
    fontWeight: "500",
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center content
    alignSelf: "center",
    backgroundColor: "#007AFF",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    minWidth: 140, // Give button a minimum width
    minHeight: 44, // Good practice for tap targets
  },
  audioButtonDisabled: {
    backgroundColor: "#999", // Visual feedback when disabled
  },
  audioText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

// Wrap in React.memo for performance
export default React.memo(SwipeCard);