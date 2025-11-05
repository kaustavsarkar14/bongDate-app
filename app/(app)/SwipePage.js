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
import { StyleSheet, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase.config";
import Toast from "react-native-toast-message";
import { getChatIdFromUserIds } from "../../utilities/functions";

const SwipePage = () => {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const handleSwipeLeft = (cardIndex) => {
    if (!users[cardIndex]) return;

    const swipedUser = users[cardIndex];
    setDoc(doc(db, "users", user.uid, "passes", swipedUser.id), swipedUser);
  };

  const handleSwipeRight = async (cardIndex) => {
    if (!users[cardIndex]) return;
    const swipedUser = users[cardIndex];
    setDoc(doc(db, "users", user.uid, "likes", swipedUser.id), swipedUser);

    const checkIfOtherUserSwiped = await getDoc(
      doc(db, "users", swipedUser.uid, "likes", user.uid)
    );

    if (checkIfOtherUserSwiped.exists()) {
      // create a chat
      Toast.show({
        type: "success",
        text1: "You matched with " + swipedUser.name,
      })
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
  }, [user.uid]);
  return (
    <View style={styles.container}>
      {!users || users.length === 0 ? (
        <Text>No more profiles</Text>
      ) : (
        <Swiper
          cards={users}
          backgroundColor={"transparent"}
          verticalSwipe={false}
          onSwipedAll={() => {
            setUsers(null);
          }}
          renderCard={(card) => {
            return (
              <View style={styles.card}>
                <Text style={styles.text}>{card.name}</Text>
              </View>
            );
          }}
          onSwipedLeft={(cardIndex) => handleSwipeLeft(cardIndex)}
          onSwipedRight={(cardIndex) => handleSwipeRight(cardIndex)}
          cardIndex={0}
          stackSize={10}
        ></Swiper>
      )}
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
