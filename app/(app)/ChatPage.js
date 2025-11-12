import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ChatItem from "../../components/ChatItem";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase.config";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const ChatPage = () => {
  const { user, getUser } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // reference to "chats" collection
    const chatsRef = collection(db, "chats");

    // setup realtime listener
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // console.log(chatList); // Keep for debugging if needed

      setChats(chatList.filter((chat) => chat.id.includes(user.uid)));
      setLoading(false);
    });

    // cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // --- MODIFIED FUNCTION ---
  const openChatWindow = async (item) => {
    if (!user) return;

    // 1. Calculate the other user's ID
    const otherUserId =
      user.uid == item.users[0].uid ? item.users[1].uid : item.users[0].uid;

    // 2. Push *only* the otherUserId. ChatWindow will handle the rest.
    router.push({
      pathname: "ChatWindow",
      params: {
        otherUserId: otherUserId,
      },
    });
  };
  // --- END MODIFICATION ---

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e600ffff" />
      </SafeAreaView>
    );
  }

  if (!chats || chats.length == 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No chats</Text>
      </SafeAreaView>
    );
  }
  return (
    <View>
      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.id}
        renderItem={({ item }) => (
          <ChatItem
            router={router}
            chat={item}
            onPress={() => openChatWindow(item)}
          />
        )}
      />
    </View>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});