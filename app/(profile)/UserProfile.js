import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LogOut, Pencil } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
// UPDATED: Added useFocusEffect
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
// UPDATED: Added useCallback, removed useEffect
import React, { useState, useCallback } from "react";
// UPDATED: Added onSnapshot, removed getDoc
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const PHOTO_GUTTER = 8;
const PHOTO_SIZE = (width - 20 * 2 - PHOTO_GUTTER * 2) / 3;

// --- Helper: Calculate Age ---
const calculateAge = (birthdate) => {
  if (!birthdate) return "?";
  try {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return "?";
  }
};

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

  // UPDATED: Replaced useEffect with useFocusEffect and onSnapshot
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      // Determine which user ID to fetch
      const targetUserId = userId || loggedInUser?.uid;

      // If no user to show (logged out, no param), then stop.
      if (!targetUserId) {
        setIsMyProfile(false);
        setProfileUser(null);
        setIsLoading(false);
        return; // Exit early
      }

      // Check if the profile we are viewing is our own
      const isMe = loggedInUser?.uid === targetUserId;
      setIsMyProfile(isMe);

      // --- KEY FIX ---
      // Set up the real-time listener
      const userDocRef = doc(db, "users", targetUserId);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          // This code runs immediately AND every time the data changes
          if (docSnap.exists()) {
            setProfileUser(docSnap.data());
          } else {
            console.error("No such user found!");
            setProfileUser(null);
          }
          setIsLoading(false); // Stop loading after data is fetched/updated
        },
        (error) => {
          // Handle any errors
          console.error("Error listening to user doc:", error);
          setProfileUser(null);
          setIsLoading(false);
        }
      );

      // Return the 'cleanup' function.
      // This runs when the screen loses focus, stopping the listener.
      return () => {
        unsubscribe();
      };
    }, [userId, loggedInUser]) // Dependencies for useCallback
  );

  // --- Render ---
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

  // Data for the loaded profile
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
            <PlaceholderImage /> // Use safe placeholder
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

        {/* --- Photos --- */}
        <SectionHeader
          title={isMyProfile ? "My Photos" : "Photos"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("RegistrationPage7")} // Re-uses the photo page
        />
        <View style={styles.photoGridContainer}>
          {profileUser.photoURIs?.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.photoGridItem} />
          ))}
        </View>

        {/* --- Interests --- */}
        <SectionHeader
          title={isMyProfile ? "My Interests" : "Interests"}
          isMyProfile={isMyProfile}
          onEdit={() => router.push("EditInterests")} // Navigates to a new page
        />
        <View style={styles.interestsContainer}>
          {profileUser.interests?.map((interest, index) => (
            <View key={index} style={styles.interestPill}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
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
    height: PHOTO_SIZE * 1.25, // Aspect ratio 3:4
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
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textTransform: "capitalize",
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