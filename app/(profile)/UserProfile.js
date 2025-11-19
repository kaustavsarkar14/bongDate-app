// --- your imports ---
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
import { LogOut, Pencil } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";
import { SafeAreaView } from "react-native-safe-area-context";
import { ALL_INTERESTS_DATA } from "../../utilities/constants";
import { calculateAge } from "../../utilities/functions";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

// ⭐ ADD THIS:
import VideoModal from "../../components/VIdeoModal";

const { width } = Dimensions.get("window");
const PHOTO_GUTTER = 8;
const PHOTO_SIZE = (width - 20 * 2 - PHOTO_GUTTER * 2) / 3;

const interestsMap = ALL_INTERESTS_DATA.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

// --- your unchanged section header ---
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

  // AUDIO PLAYER
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);
  const isUnmounted = useRef(false);

  // ⭐ VIDEO MODAL STATES ⭐
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideoURL, setSelectedVideoURL] = useState(null);

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

      setIsMyProfile(loggedInUser?.uid === targetUserId);

      const userRef = doc(db, "users", targetUserId);
      const unsub = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            setProfileUser(snap.data());
          }
          setIsLoading(false);
        },
        () => setIsLoading(false)
      );

      return () => {
        unsub();
        setCurrentPlayingUrl(null);
      };
    }, [userId, loggedInUser])
  );

  const playAudio = async (uri) => {
    try {
      if (currentPlayingUrl === uri) {
        if (playerStatus.isPlaying) {
          await player.pause();
        } else {
          if (playerStatus.didJustFinish) await player.seekTo(0);
          await player.play();
        }
      } else {
        setCurrentPlayingUrl(uri);
        await player.replace(uri);
        await player.play();
      }
    } catch {
      Alert.alert("Error", "Failed to play audio");
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
    profileUser.photoURIs?.length > 0 ? profileUser.photoURIs[0] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <PlaceholderImage />
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.nameText}>
              {profileUser.name}, {age}
            </Text>
            <Text style={styles.detailText}>{profileUser.gender}</Text>
            <Text style={styles.detailText}>{profileUser.religion}</Text>
          </View>
        </View>

        {/* INTERESTS */}
        <SectionHeader
          title={isMyProfile ? "My Interests" : "Interests"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("RegistrationPage5")}
        />
        <View style={styles.interestsContainer}>
          {profileUser.interests?.map((slug) => {
            const item = interestsMap[slug];
            if (!item)
              return (
                <View key={slug} style={styles.interestPill}>
                  <Text>{slug}</Text>
                </View>
              );
            return (
              <View key={slug} style={styles.interestPill}>
                <Text style={styles.interestEmoji}>{item.emoji}</Text>
                <Text style={styles.interestText}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ------------ ⭐ VIDEO SECTION ADDED HERE ⭐ ------------ */}
        <SectionHeader
          title={isMyProfile ? "My Videos" : "Videos"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("UploadVideo")}
        />

        <View style={styles.photoGridContainer}>
          {(profileUser.videoURLs || []).map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSelectedVideoURL(item.videoURL);
                setVideoModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.thumbnailURL }}
                style={styles.photoGridItem}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* VIDEO MODAL */}
       <VideoModal
  visible={videoModalVisible}
  videoURL={selectedVideoURL}
  onClose={() => setVideoModalVisible(false)}
/>

        {/* ------------ END VIDEO SECTION ------------ */}

        {/* AUDIO */}
        <SectionHeader
          title={isMyProfile ? "My Voice Notes" : "Voice Notes"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("UploadAudio")}
        />

        {profileUser.audioUrls?.map((audioUrl, index) => (
          <TouchableOpacity
            key={index}
            style={styles.audioButton}
            onPress={() => playAudio(audioUrl)}
          >
            <Text style={styles.audioButtonText}>Play Note {index + 1}</Text>
          </TouchableOpacity>
        ))}

        {/* PHOTOS */}
        <SectionHeader
          title={isMyProfile ? "My Photos" : "Photos"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("RegistrationPage7")}
        />
        <View style={styles.photoGridContainer}>
          {profileUser.photoURIs?.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.photoGridItem} />
          ))}
        </View>

        {/* LOGOUT */}
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

// --- YOUR EXISTING STYLES (UNTOUCHED) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  centerContainer: { justifyContent: "center", alignItems: "center" },
  container: { flex: 1, paddingHorizontal: 20 },
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
    backgroundColor: "#eee",
    marginRight: 20,
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  placeholderImage: {
    backgroundColor: "#eee",
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  infoContainer: { flex: 1 },
  nameText: { fontSize: 24, fontWeight: "bold", color: "#111" },
  detailText: { fontSize: 16, color: "#555", textTransform: "capitalize" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#222" },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  editButtonText: { marginLeft: 5, color: "#555", fontWeight: "500" },
  interestsContainer: { flexDirection: "row", flexWrap: "wrap" },
  interestPill: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestEmoji: { marginRight: 6 },
  interestText: { fontSize: 14 },
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
  audioButton: {
    backgroundColor: "#E91E63",
    padding: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  audioButtonText: { color: "#fff", textAlign: "center" },
  logoutButton: {
    backgroundColor: "#FFF0F0",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "center",
  },
  logoutText: { marginLeft: 10, color: "#D90429", fontWeight: "500" },
});

export default UserProfile;
