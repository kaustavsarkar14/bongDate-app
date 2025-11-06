import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { User, Play } from "lucide-react-native";
import { calculateAge } from "../utilities/functions";


const SwipeCard = ({ user, replayAudio, status }) => {
  const age = calculateAge(user.birthdate);



  return (
    <View style={styles.card}>
      {/* Name */}
      <Text style={styles.name}>{user.name.trim()}</Text>

      {/* Gender, Age, Religion */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <User size={18} color="#222" />
          <Text style={styles.infoText}>
            {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
          </Text>
        </View>

        <View style={styles.dot} />
        <Text style={styles.infoText}>{age} yrs</Text>

        <View style={styles.dot} />
        <Text style={styles.infoText}>
          {user.religion.charAt(0).toUpperCase() + user.religion.slice(1)}
        </Text>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.hobbyContainer}>
          {user.interests?.map((item, index) => (
            <View key={index} style={styles.hobbyChip}>
              <Text style={styles.hobbyText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Replay Button */}
      <TouchableOpacity style={styles.audioButton} onPress={replayAudio} disabled={status.isPlaying}>
  <Play size={18} color="#fff" />
  <Text style={styles.audioText}>
    {status.playing ? "Playing..." : "Replay"}
  </Text>
</TouchableOpacity>
    </View>
  );
};

export default SwipeCard;

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
    alignSelf: "center",
    backgroundColor: "#007AFF",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  audioText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
