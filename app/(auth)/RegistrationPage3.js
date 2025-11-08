import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot, 
  query,
  setDoc,
  where, // 👈 Added for the query
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase.config";
import Toast from "react-native-toast-message";
import { getChatIdFromUserIds } from "../../utilities/functions";
import SwipeCard from "../../components/SwipeCard";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioSampleListener,
} from "expo-audio";
import SwipeCardDetail from "../../components/SwipeCardDetail";

const SwipePage = () => {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { user } = useAuth(); // Contains current logged-in user details

  const [audioSource, setAudioSource] = useState(null);

  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  const handleSwipe = (cardIndex) => {
    console.log("first");
    if (cardIndex === users.length - 1) { // Fixed comparison operator
      return;
    }
    if (!users[cardIndex]) return;
    setAudioSource(
      users[cardIndex + 1].audioUrls?.[Math.floor(Math.random() * 3)]
    );
  };
  const handleSwipeLeft = (cardIndex) => {
    if (!users[cardIndex]) return;
    const swipedUser = users[cardIndex];
    
    // Remove swiped user from state first for snappy UI
    setUsers((prevUsers) =>
      prevUsers.filter((_, index) => index !== cardIndex)
    );

    // Persist the pass action to Firestore
    setDoc(doc(db, "users", user.uid, "passes", swipedUser.id), swipedUser);
  };

  const handleSwipeRight = async (cardIndex) => {
    if (!users[cardIndex]) return;
    const swipedUser = users[cardIndex];

    // Remove swiped user from state first for snappy UI
    setUsers((prevUsers) =>
      prevUsers.filter((_, index) => index !== cardIndex)
    );

    // Persist the like action to Firestore
    setDoc(doc(db, "users", user.uid, "likes", swipedUser.id), swipedUser);

    // Check for a match
    const checkIfOtherUserSwiped = await getDoc(
      doc(db, "users", swipedUser.uid, "likes", user.uid)
    );
    
    if (checkIfOtherUserSwiped.exists()) {
      // It's a match!
      Toast.show({
        type: "success",
        text1: "You matched with " + swipedUser.name,
      });

      // Create a chat document
      setDoc(doc(db, "chats", getChatIdFromUserIds(user.uid, swipedUser.uid)), {
        isLocked: true,
        users: [
          {
            uid: user.uid,
            profileUnlockRequest: false,
          },
          {
            uid: swipedUser.uid,
            profileUnlockRequest: false,
          },
        ],
      });
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // --- 1. Get Exclusion IDs (Passed, Liked, and Self) ---
        const [passesSnapshot, likesSnapshot] = await Promise.all([
          getDocs(collection(db, "users", user.uid, "passes")),
          getDocs(collection(db, "users", user.uid, "likes")),
        ]);
        
        const passedUserIds = passesSnapshot.docs.map((doc) => doc.id);
        const swipedUserIds = likesSnapshot.docs.map((doc) => doc.id);

        const excludedIds = [
          ...new Set([
            ...passedUserIds,
            ...swipedUserIds,
            user.uid, // Always exclude self
          ]),
        ];

        // --- 2. Implement Gender Preference Filter using Firestore 'where' ---
        
        // Ensure oppositeGenderPreference is an array, default to empty for safety
        const genderPreferences = user.oppositeGenderPreference || [];

        if (genderPreferences.length === 0) {
          // If no preferences, show no profiles (or adjust logic as needed)
          setUsers([]);
          setLoading(false);
          return;
        }

        // Construct the Firestore query: Filter by gender
        const usersQuery = query(
          collection(db, "users"),
          where("gender", "in", genderPreferences) // 🎯 EFFICIENT FILTER
        );

        const usersSnapshot = await getDocs(usersQuery);

        const usersMatchingGender = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.id, // Ensure uid is present for the exclusion filter
          ...doc.data(),
        }));

        // --- 3. Client-Side Filter for Exclusions ---
        const filteredUsers = usersMatchingGender.filter(
          (u) => !excludedIds.includes(u.uid) && u.uid !== user.uid // Redundant u.uid !== user.uid if excludedIds includes it, but safe
        );

        setUsers(filteredUsers);

      } catch (error) {
        console.error("Error fetching users:", error);
        Toast.show({
          type: "error",
          text1: "Error fetching users",
          text2: error.message,
        });
        setUsers(null); // Clear users on error
      } finally {
        setLoading(false);
      }
    };

    // The fetchUsers function relies on user object which is available via useAuth()
    // It is safe to call it once the component mounts and 'user' is ready.
    if (user?.uid) {
        fetchUsers();
    }

  }, [user?.uid, user?.oppositeGenderPreference]); // Re-run if preferences change

  const replayAudio = () => {
    if (!player || !status.isLoaded) return;
    player.seekTo(0);
    player.play();
  };
  const pauseAudio = () => {
    if (!player || !status.isLoaded) return;
    player.pause();
  };
  
  // Auto-play audio when audioSource changes
  useEffect(() => {
    if (audioSource) {
      player.play();
    }
    return () => {
        // Optional cleanup on unmount or before next effect runs
    };
  }, [audioSource]);

  // Set initial audio source for the first card
  useEffect(() => {
    if (users && users.length > 0 && !audioSource) {
      const firstAudio =
        users[0].audioUrls[
          Math.floor(Math.random() * users[0].audioUrls.length)
        ];
      setAudioSource(firstAudio);
    }
  }, [users, audioSource]); // Check audioSource to avoid resetting it unnecessarily

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {!users || users.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 20 }}>No more profiles 😢</Text>
        </View>
      ) : (
        <Swiper
          // key helps re-render Swiper when user list or play status changes
          key={`${users?.length}-${status.playing}`} 
          keyExtractor={(card) => card.uid}
          cards={users}
          backgroundColor={"transparent"}
          verticalSwipe={false}
          disableBottomSwipe={true}
          onSwipedAll={() => {
            setUsers(null);
          }}
          renderCard={(card) => {
            return (
              <SwipeCard
                user={card}
                replayAudio={replayAudio}
                player={player}
                status={status}
                key={card.uid}
                pauseAudio={pauseAudio}
              />
            );
          }}
          onSwipedLeft={(cardIndex) => handleSwipeLeft(cardIndex)}
          onSwipedRight={(cardIndex) => handleSwipeRight(cardIndex)}
          onSwipedTop={() => {
            console.log("swipped top");
          }}
          onSwiped={handleSwipe}
          cardIndex={0}
          stackSize={10}
        />
      )}
      
      <SwipeCardDetail
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
};

export default SwipePage;

// --- Stylesheet remains the same ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#F5FCFF",
  },
  card: {
    height: 400,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "blue",
    justifyContent: "center",
    backgroundColor: "#FF94CF",
  },
  text: {
    textAlign: "center",
    fontSize: 50,
    backgroundColor: "transparent",
  },
});