import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
// 1. IMPORT ICONS
import { LogOut, Pencil, Play, Pause, RefreshCw } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";
import { SafeAreaView } from "react-native-safe-area-context";
import { ALL_INTERESTS_DATA } from "../../utilities/constants";
import { calculateAge } from "../../utilities/functions";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const { width } = Dimensions.get("window");
const PHOTO_GUTTER = 8;
const PHOTO_SIZE = (width - 20 * 2 - PHOTO_GUTTER * 2) / 3;

// CREATE LOOKUP MAP
const interestsMap = ALL_INTERESTS_DATA.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

// --- Helper: Section Header ---
const SectionHeader = ({ title, onEdit, isMyProfile }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {isMyProfile && (
      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <Pencil color="#555" size={16} />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    )}
  </View>
);

// --- Helper: Placeholder Image ---
const PlaceholderImage = () => (
  <View style={[styles.profileImage, styles.placeholderImage]} />
);

const UserProfile = () => {
  const { logout, user: loggedInUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = params;

  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyProfile, setIsMyProfile] = useState(false);

  // --- AUDIO PLAYER SETUP ---
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);

  // Ref to prevent crash on unmount
  const isUnmounted = useRef(false);

  // --- HOOK FOR FOCUS/BLUR ---
  useFocusEffect(
    useCallback(() => {
      isUnmounted.current = false;
      setIsLoading(true);
      const targetUserId = userId || loggedInUser?.uid;

      if (!targetUserId) {
        setIsMyProfile(false);
        setProfileUser(null);
        setIsLoading(false);
        return;
      }

      const isMe = loggedInUser?.uid === targetUserId;
      setIsMyProfile(isMe);

      const userDocRef = doc(db, "users", targetUserId);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfileUser(docSnap.data());
          } else {
            console.error("No such user found!");
            setProfileUser(null);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Error listening to user doc:", error);
          setProfileUser(null);
          setIsLoading(false);
        }
      );

      // Cleanup on blur
      return () => {
        unsubscribe();
        if (!isUnmounted.current) {
          // player.pause();
          setCurrentPlayingUrl(null);
        }
      };
    }, [userId, loggedInUser, player])
  );

  // --- HOOK FOR MOUNT/UNMOUNT ---
  useEffect(() => {
    isUnmounted.current = false;
    // Cleanup on unmount
    return () => {
      isUnmounted.current = true;
      // player.remove(); // This prevents memory leaks
    };
  }, [player]);

  // --- AUDIO PLAY/PAUSE FUNCTION ---
  const playAudio = async (uri) => {
    try {
      if (currentPlayingUrl === uri) {
        // --- It's the SAME track ---
        if (playerStatus.isPlaying) {
          // 1. Is playing -> PAUSE
          await player.pause();
        } else {
          // 2. Is paused or finished -> PLAY
          
          // 3. (NEW) If it finished, rewind to start
          if (playerStatus.didJustFinish) {
            await player.seekTo(0);
          }
          await player.play();
        }
      } else {
        // --- It's a NEW track ---
        setCurrentPlayingUrl(uri);
        await player.replace(uri);
        await player.play();
      }
    } catch (error) {
      console.error("Failed to play audio", error);
      Alert.alert("Error", "Failed to play audio.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <Text>User not found.</Text>
      </SafeAreaView>
    );
  }

  const age = calculateAge(profileUser.birthdate);
  const profileImage =
    profileUser.photoURIs && profileUser.photoURIs.length > 0
      ? profileUser.photoURIs[0]
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* --- Header --- */}
        <View style={styles.headerContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <PlaceholderImage />
          )}
          <View style={styles.infoContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {profileUser.name || "User"}, {age}
            </Text>
            <Text style={styles.detailText}>
              {profileUser.gender || "Gender"}
            </Text>
            <Text style={styles.detailText}>
              {profileUser.religion || "Religion"}
            </Text>
          </View>
        </View>

        {/* --- Interests --- */}
        <SectionHeader
          title={isMyProfile ? "My Interests" : "Interests"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("RegistrationPage5")}
        />
        <View style={styles.interestsContainer}>
          {profileUser.interests?.map((interestSlug) => {
            // ... (your interest logic is correct)
            const interestData = interestsMap[interestSlug];
            if (!interestData) {
              return (
                <View key={interestSlug} style={styles.interestPill}>
                  <Text style={styles.interestText}>{interestSlug}</Text>
                </View>
              );
            }
            return (
              <View key={interestData.slug} style={styles.interestPill}>
                <Text style={styles.interestEmoji}>{interestData.emoji}</Text>
                <Text style={styles.interestText}>{interestData.label}</Text>
              </View>
            );
          })}
        </View>

        {/* --- 3. UPDATED AUDIO PLAYER UI --- */}

        {/* VVVV THIS IS THE NEWLY ADDED SECTION VVVV */}
        <SectionHeader
          title={isMyProfile ? "My Voice Notes" : "Voice Notes"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("UploadAudio")}
        />
        {/* ^^^^ END OF NEWLY ADDED SECTION ^^^^ */}
        
        {profileUser.audioUrls?.map((audioUrl, index) => {
          // Filter out null or empty URLs just in case
          if (!audioUrl) return null;
          
          const isThisTrackActive = currentPlayingUrl === audioUrl;

          // Derive states from playerStatus
          const isLoading =
            isThisTrackActive &&
            playerStatus.isBuffering &&
            !playerStatus.isPlaying;
          const isPlaying = isThisTrackActive && playerStatus.isPlaying;
          const didFinish = isThisTrackActive && playerStatus.didJustFinish;

          let icon;
          let text;

          if (isLoading) {
            // State 1: Loading
            icon = <ActivityIndicator color="#fff" size={24} />;
            text = "Loading...";
          } else if (isPlaying) {
            // State 2: Playing
            icon = <Pause color="#fff" size={24} fill="#fff" />;
            text = "Pause";
          } else if (didFinish) {
            // State 3: Finished (Ready for Replay)
            icon = <RefreshCw color="#fff" size={24} />;
            text = `Replay Note ${index + 1}`;
          } else {
            // State 4: Default (Paused or ready to play)
            icon = <Play color="#fff" size={24} fill="#fff" />;
            text = `Play Voice Note ${index + 1}`;
          }

          return (
            <View key={index} style={styles.audioPlayer}>
              <TouchableOpacity
                onPress={() => playAudio(audioUrl)}
                style={styles.audioButton}
                disabled={isLoading} // Disable button only while loading
              >
                <View style={styles.audioIconContainer}>{icon}</View>
                <Text style={styles.audioButtonText}>{text}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* --- Photos --- */}
        <SectionHeader
          title={isMyProfile ? "My Photos" : "Photos"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("RegistrationPage7")}
        />
        <View style={styles.photoGridContainer}>
          {profileUser.photoURIs?.map((uri, index) => {
            // Filter out null or empty URLs just in case
            if (!uri) return null;
            return (
              <Image key={index} source={{ uri }} style={styles.photoGridItem} />
            );
          })}
        </View>

        {/* --- Logout --- */}
        {isMyProfile && (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut color="#D90429" size={20} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLES (Unchanged) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EEEEEE",
    marginRight: 20,
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  placeholderImage: {
    backgroundColor: "#EEEEEE",
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 5,
    fontWeight: "500",
  },
  // Photos
  photoGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(PHOTO_GUTTER / 2),
  },
  photoGridItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.25,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginHorizontal: PHOTO_GUTTER / 2,
    marginBottom: PHOTO_GUTTER,
  },
  // Interests
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  interestText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  // Audio
  audioPlayer: {
    marginBottom: 10,
    // marginTop: 10, <-- Removed, as SectionHeader has margin
  },
  audioButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    flexDirection: "row", // <-- Make button row for icon + text
    justifyContent: "center", // <-- Center icon and text
  },
  audioIconContainer: {
    width: 24, // Give icon a fixed width
    height: 24, // Give icon a fixed height
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  audioButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 40,
  },
  logoutText: {
    fontSize: 16,
    color: "#D90429",
    marginLeft: 10,
    fontWeight: "500",
  },
});

export default UserProfile;