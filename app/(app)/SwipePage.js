// app/screens/SwipePage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase.config";
import Toast from "react-native-toast-message";
import { getChatIdFromUserIds } from "../../utilities/functions";
import SwipeCard from "../../components/SwipeCard";
import { getDocs, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

const SwipePage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  // uid of the currently-active top card (only this card's video will play)
  const [activeVideoUid, setActiveVideoUid] = useState(null);

  // keep a ref for users so callbacks work with latest array
  const usersRef = useRef(null);
  usersRef.current = users;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const passesSnapshot = await getDocs(
          collection(db, "users", user.uid, "passes")
        );
        const passedUserIds = passesSnapshot.docs.map((d) => d.id);

        const likesSnapshot = await getDocs(
          collection(db, "users", user.uid, "likes")
        );
        const swipedUserIds = likesSnapshot.docs.map((d) => d.id);

        const excludedIds = [
          ...new Set([...passedUserIds, ...swipedUserIds, user.uid]),
        ];

        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const filteredUsers = allUsers.filter(
          (u) => !excludedIds.includes(u.uid) && u.uid !== user.uid
        );

        setUsers(filteredUsers);

        // set the first active video to the first user (if exists)
        if (filteredUsers && filteredUsers.length > 0) {
          setActiveVideoUid(filteredUsers[0].uid);
        } else {
          setActiveVideoUid(null);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        Toast.show({
          type: "error",
          text1: "Error fetching users",
          text2: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // handle swipe left (pass)
  const handleSwipeLeft = (cardIndex) => {
    const currentUsers = usersRef.current;
    if (!currentUsers || !currentUsers[cardIndex]) return;

    const swipedUser = currentUsers[cardIndex];
    // remove locally
    setUsers((prev) => prev.filter((_, i) => i !== cardIndex));

    // write pass to Firestore (under current user's passes)
    setDoc(doc(db, "users", user.uid, "passes", swipedUser.id), swipedUser).catch(
      (e) => {
        console.error("Error saving pass:", e);
      }
    );
  };

  // handle swipe right (like)
  const handleSwipeRight = async (cardIndex) => {
    const currentUsers = usersRef.current;
    if (!currentUsers || !currentUsers[cardIndex]) return;

    const swipedUser = currentUsers[cardIndex];

    // remove locally
    setUsers((prev) => prev.filter((_, i) => i !== cardIndex));

    // write like to Firestore
    // await setDoc(doc(db, "users", user.uid, "likes", swipedUser.id), swipedUser).catch(
    //   (e) => {
    //     console.error("Error saving like:", e);
    //   }
    // );

    // // check if other user already liked current user -> match
    // try {
    //   const checkSnapshot = await getDoc(
    //     doc(db, "users", swipedUser.uid, "likes", user.uid)
    //   );
    //   if (checkSnapshot.exists()) {
    //     Toast.show({
    //       type: "success",
    //       text1: `You matched with ${swipedUser.name}`,
    //     });

    //     await setDoc(doc(db, "chats", getChatIdFromUserIds(user.uid, swipedUser.uid)), {
    //       isLocked: true,
    //       users: [
    //         { uid: user.uid, profileUnlockRequest: false },
    //         { uid: swipedUser.uid, profileUnlockRequest: false },
    //       ],
    //     });

    //     // navigate to chat window (adjust route/path if needed)
    //     router.push({
    //       pathname: "ChatWindow",
    //       params: { otherUserId: swipedUser.id },
    //     });
    //   }
    // } catch (e) {
    //   console.error("Error checking match:", e);
    // }
  };

  // generic onSwiped handler (called after a card is swiped)
  // deck-swiper passes the index of the card that was swiped
  const handleSwiped = (cardIndex) => {
    // active should be next card in the list (cardIndex points to the card just swiped)
    const nextIndex = cardIndex + 1;
    if (!usersRef.current || nextIndex >= usersRef.current.length) {
      setActiveVideoUid(null);
      return;
    }
    const next = usersRef.current[nextIndex];
    if (next) setActiveVideoUid(next.uid);
  };

  if (loading) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!users || users.length === 0 ? (
        <View style={styles.centerFull}>
          <Text style={{ fontSize: 20 }}>No more profiles 😢</Text>
        </View>
      ) : (
        <Swiper
          key={`${users?.length}-${activeVideoUid ?? "no"}`}
          cards={users}
          cardIndex={0}
          verticalSwipe={false}
          disableBottomSwipe
          stackSize={3}
          backgroundColor="transparent"
          onSwipedAll={() => setUsers(null)}
          onSwiped={handleSwiped}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          keyExtractor={(card) => card.uid}
          renderCard={(card) => {
            // determine if this card is currently the active one
            const isActive = card.uid === activeVideoUid;
            // pass only the first video url (safe fallback)
            const videoUrl = Array.isArray(card.videoURLs) && card.videoURLs.length > 0
              ? card.videoURLs[0]
              : null;

            return (
              <SwipeCard
                user={card}
                videoUrl={videoUrl}
                isActive={isActive}
              />
            );
          }}
        />
      )}
    </View>
  );
};

export default SwipePage;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFull: { flex: 1, justifyContent: "center", alignItems: "center" },
});
