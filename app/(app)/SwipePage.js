import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  const { user } = useAuth();

  const [audioSource, setAudioSource] = useState(null);

  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  const handleSwipe = (cardIndex) => {
    console.log("first");
    if (cardIndex == users.length - 1) {
      return;
    }
    if (!users[cardIndex]) return;
    setAudioSource(
      users[cardIndex + 1].audioUrls?.[Math.floor(Math.random() * 3)]
    );
  };
  const handleSwipeLeft = (cardIndex) => {
    if (!users[cardIndex]) return;
    setUsers((prevUsers) =>
      prevUsers.filter((_, index) => index !== cardIndex)
    );

    const swipedUser = users[cardIndex];
    setDoc(doc(db, "users", user.uid, "passes", swipedUser.id), swipedUser);
  };

  const handleSwipeRight = async (cardIndex) => {
    setUsers((prevUsers) =>
      prevUsers.filter((_, index) => index !== cardIndex)
    );
    // const swipedUser = users[cardIndex];
    // setDoc(doc(db, "users", user.uid, "likes", swipedUser.id), swipedUser);
    // const checkIfOtherUserSwiped = await getDoc(
    //   doc(db, "users", swipedUser.uid, "likes", user.uid)
    // );
    // if (checkIfOtherUserSwiped.exists()) {
    //   // create a chat
    //   Toast.show({
    //     type: "success",
    //     text1: "You matched with " + swipedUser.name,
    //   });
    //   setDoc(doc(db, "chats", getChatIdFromUserIds(user.uid, swipedUser.uid)), {
    //     isLocked: true,
    //     users: [
    //       {
    //         uid: user.uid,
    //         profileUnlockRequest: false,
    //       },
    //       {
    //         uid: swipedUser.uid,
    //         profileUnlockRequest: false,
    //       },
    //     ],
    //   });
    // }
  };

  useEffect(() => {
    let unsub;

    const fetchUsers = async () => {
      try {
        // ✅ 1. Fetch passed user IDs
        const passesSnapshot = await getDocs(
          collection(db, "users", user.uid, "passes")
        );
        const passedUserIds = passesSnapshot.docs.map((doc) => doc.id);

        // ✅ 2. Fetch swiped user IDs
        const likesSnapshot = await getDocs(
          collection(db, "users", user.uid, "likes")
        );
        const swipedUserIds = likesSnapshot.docs.map((doc) => doc.id);

        // ✅ 3. Combine all exclusion IDs
        const excludedIds = [
          ...new Set([
            ...passedUserIds,
            ...swipedUserIds,
            user.uid, // or user.id if that’s how you store it
          ]),
        ];

        // ✅ 4. Real-time listener for all users
        unsub = onSnapshot(collection(db, "users"), (snapshot) => {
          const allUsers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // ✅ 5. Filter out excluded users
          const filteredUsers = allUsers.filter(
            (u) => !excludedIds.includes(u.uid) && u.uid !== user.uid
          );
          setUsers(filteredUsers);
        });
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
    // ✅ 6. Cleanup
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const replayAudio = () => {
    if (!player || !status.isLoaded) return; // check player exists and is loaded
    player.seekTo(0);
    player.play();
  };
const pauseAudio = () => {
  if (!player || !status.isLoaded) return; // check player exists and is loaded
  player.pause();
}
  useEffect(() => {
    console.log("audioSource" + audioSource);
    if (audioSource) {
      player.play();
    }
    return () => {};
  }, [audioSource]);

  useEffect(() => {
    if (users?.length > 0) {
      const firstAudio =
        users[0].audioUrls[
          Math.floor(Math.random() * users[0].audioUrls.length)
        ];
      setAudioSource(firstAudio);
    }
  }, [users]);

  return (
    <View style={styles.container}>
      {!users || users.length === 0 ? (
        <Text>No more profiles</Text>
      ) : (
        <Swiper
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
        ></Swiper>
      )}
      <TouchableOpacity
        onPress={() => {
          setShowProfileModal(true);
        }}
      >
        <Text>Open Modal</Text>
      </TouchableOpacity>

      <SwipeCardDetail
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
};

export default SwipePage;

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
